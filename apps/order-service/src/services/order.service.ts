import { getBrokerClient } from '@streamflix/shared-broker'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../db/connection.js'
import { orderItems, orders } from '../db/schema.js'
import type {
  CreateOrderData,
  Order,
  OrdersListResponse,
  OrdersQuery,
  OrderStatsResponse,
  UpdateOrderStatusData,
} from '../types/order.js'

export class OrderService {
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        id: crypto.randomUUID(),
        userId: orderData.userId,
        subscriptionPlan: orderData.subscriptionPlan,
        amount: orderData.amount,
        currency: orderData.currency,
        status: 'pending',
        paymentMethod: orderData.paymentMethod || null,
        transactionId: null,
        metadata: orderData.metadata
          ? JSON.stringify(orderData.metadata)
          : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // Create order items if provided
    if (orderData.items && orderData.items.length > 0) {
      const itemsToInsert = orderData.items.map(item => ({
        id: crypto.randomUUID(),
        orderId: order.id,
        itemType: item.itemType,
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        createdAt: new Date(),
      }))

      await db.insert(orderItems).values(itemsToInsert)
    }

    // Publish event
    const broker = getBrokerClient()
    await broker.publishOrderCreated({
      orderId: order.id,
      userId: order.userId,
      subscriptionPlan: order.subscriptionPlan,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
    })

    return order
  }

  async getOrderById(id: string): Promise<Order | null> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id))
    return order || null
  }

  async getOrders(query: OrdersQuery): Promise<OrdersListResponse> {
    const { page, limit, userId, status } = query
    const offset = (page - 1) * limit

    // Build where conditions
    let whereCondition = undefined
    if (userId && status) {
      whereCondition = eq(orders.userId, userId) && eq(orders.status, status)
    } else if (userId) {
      whereCondition = eq(orders.userId, userId)
    } else if (status) {
      whereCondition = eq(orders.status, status)
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereCondition)

    const total = Number(countResult[0]?.count || 0)

    // Get orders with pagination
    const ordersList = await db
      .select()
      .from(orders)
      .where(whereCondition)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      orders: ordersList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async updateOrderStatus(
    id: string,
    statusData: UpdateOrderStatusData,
  ): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: statusData.status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()

    if (!updatedOrder) {
      throw new Error('Order not found')
    }

    return updatedOrder
  }

  async getOrderStats(): Promise<OrderStatsResponse> {
    const stats = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        pendingOrders: sql<number>`count(*) filter (where status = 'pending')`,
        completedOrders: sql<number>`count(*) filter (where status = 'completed')`,
        totalRevenue: sql<string>`coalesce(sum(cast(amount as decimal)), '0')`,
      })
      .from(orders)

    return {
      totalOrders: Number(stats[0]?.totalOrders || 0),
      pendingOrders: Number(stats[0]?.pendingOrders || 0),
      completedOrders: Number(stats[0]?.completedOrders || 0),
      totalRevenue: stats[0]?.totalRevenue || '0',
    }
  }
}
