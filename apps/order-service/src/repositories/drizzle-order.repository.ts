import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db/connection.js'
import { orderItems, orders } from '../db/schema.js'
import {
  HttpError,
  InternalServerError,
  NotFoundError,
} from '../errors/http-errors.js'
import type {
  OrderItemRepository,
  OrderRepository,
} from '../interfaces/order-repository.interface.js'
import type { CreateOrderData, Order, OrderItem } from '../types/order.js'

// Interface para itens a serem inseridos no banco (com valores string)
interface OrderItemInsert {
  orderId: string
  itemType: string
  itemId: string
  itemName: string
  quantity: string
  unitPrice: string
  totalPrice: string
}

export class DrizzleOrderRepository
  implements OrderRepository, OrderItemRepository
{
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    try {
      const [order] = await db
        .insert(orders)
        .values({
          userId: orderData.userId,
          subscriptionPlan: orderData.subscriptionPlan,
          amount: orderData.amount.toString(),
          currency: orderData.currency,
          status: 'pending',
          paymentMethod: orderData.paymentMethod || null,
          transactionId: null,
          metadata: orderData.metadata
            ? JSON.stringify(orderData.metadata)
            : null,
        })
        .returning()

      if (!order) {
        throw new InternalServerError('Failed to create order')
      }

      // Create order items if provided
      if (orderData.items && orderData.items.length > 0) {
        await this.createOrderItems(orderData.items)
      }

      return {
        ...order,
        amount: parseFloat(order.amount),
        items: [],
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to create order')
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, id))

      if (!order) {
        return null
      }

      // Get order items
      const items = await this.getOrderItems(order.id)

      return {
        ...order,
        amount: parseFloat(order.amount),
        items,
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to retrieve order')
    }
  }

  async getOrders(params: {
    page: number
    limit: number
    status?: string
    userId?: string
  }): Promise<{ orders: Order[]; total: number }> {
    try {
      const { page, limit, status, userId } = params
      const offset = (page - 1) * limit

      // Build where conditions
      let whereCondition = undefined
      if (status && userId) {
        whereCondition = and(
          eq(
            orders.status,
            status as
              | 'pending'
              | 'processing'
              | 'completed'
              | 'cancelled'
              | 'refunded',
          ),
          eq(orders.userId, userId),
        )
      } else if (status) {
        whereCondition = eq(
          orders.status,
          status as
            | 'pending'
            | 'processing'
            | 'completed'
            | 'cancelled'
            | 'refunded',
        )
      } else if (userId) {
        whereCondition = eq(orders.userId, userId)
      }

      // Get orders
      const ordersResult = await db
        .select()
        .from(orders)
        .where(whereCondition)
        .limit(limit)
        .offset(offset)

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereCondition)

      const total = countResult[0]?.count || 0

      // Get items for each order
      const ordersWithItems = await Promise.all(
        ordersResult.map(async order => {
          const items = await this.getOrderItems(order.id)
          return {
            ...order,
            amount: parseFloat(order.amount),
            items,
          }
        }),
      )

      return {
        orders: ordersWithItems,
        total: Number(total),
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to retrieve orders')
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    try {
      const [order] = await db
        .update(orders)
        .set({
          status: status as
            | 'pending'
            | 'processing'
            | 'completed'
            | 'cancelled'
            | 'refunded',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning()

      if (!order) {
        throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND')
      }

      // Get order items
      const items = await this.getOrderItems(order.id)

      return {
        ...order,
        amount: parseFloat(order.amount),
        items,
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to update order status')
    }
  }

  async getOrderStats(): Promise<{
    totalOrders: number
    pendingOrders: number
    completedOrders: number
  }> {
    try {
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)

      const pendingResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, 'pending'))

      const completedResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, 'completed'))

      return {
        totalOrders: Number(totalResult[0]?.count || 0),
        pendingOrders: Number(pendingResult[0]?.count || 0),
        completedOrders: Number(completedResult[0]?.count || 0),
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to retrieve order statistics')
    }
  }

  async createOrderItems(
    items: Omit<OrderItem, 'id' | 'createdAt'>[],
  ): Promise<OrderItem[]> {
    if (items.length === 0) return []

    try {
      const itemsToInsert: OrderItemInsert[] = items.map(item => ({
        orderId: item.orderId,
        itemType: item.itemType,
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
      }))

      const result = await db
        .insert(orderItems)
        .values(itemsToInsert)
        .returning()

      return result.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.totalPrice),
      }))
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to create order items')
    }
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    try {
      const result = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId))
      return result.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.totalPrice),
      }))
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to retrieve order items')
    }
  }
}
