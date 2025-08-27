import { getBrokerClient } from '@streamflix/shared-broker'
import { desc, eq, sql } from 'drizzle-orm'
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
    const db = await this.getDb()

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
    const db = await this.getDb()
    const [order] = await db.select().from(orders).where(eq(orders.id, id))
    return order || null
  }

  async getOrders(query: OrdersQuery): Promise<OrdersListResponse> {
    const db = await this.getDb()
    const { page, limit, userId, status } = query
    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions = []
    if (userId) whereConditions.push(eq(orders.userId, userId))
    if (status) whereConditions.push(eq(orders.status, status))

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereConditions.length > 0 ? whereConditions : undefined)

    const total = countResult[0]?.count || 0

    // Get orders with pagination
    const ordersList = await db
      .select()
      .from(orders)
      .where(whereConditions.length > 0 ? whereConditions : undefined)
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
    const db = await this.getDb()
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
    const db = await this.getDb()

    const stats = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        pendingOrders: sql<number>`count(*) filter (where status = 'pending')`,
        completedOrders: sql<number>`count(*) filter (where status = 'completed')`,
        totalRevenue: sql<string>`coalesce(sum(cast(amount as decimal)), '0')`,
      })
      .from(orders)

    return {
      totalOrders: stats[0]?.totalOrders || 0,
      pendingOrders: stats[0]?.pendingOrders || 0,
      completedOrders: stats[0]?.completedOrders || 0,
      totalRevenue: stats[0]?.totalRevenue || '0',
    }
  }

  private async getDb() {
    // This would return the database connection
    // For now, we'll assume it's available globally
    return (globalThis as any).db
  }
}
