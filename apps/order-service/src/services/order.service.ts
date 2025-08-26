import { getBrokerClient } from '@streamflix/shared-broker'
import { eq } from 'drizzle-orm'
import { db } from '../db/connection.js'
import { orders, type Order } from '../db/schema.js'

export class OrderService {
  /**
   * Create a new order (simplified)
   */
  async createOrder(orderData: {
    userId: string
    subscriptionPlan: string
    amount: string
    currency: string
  }): Promise<Order> {
    try {
      console.log('📝 Creating order...')

      // Create order in database
      const [order] = await db
        .insert(orders)
        .values({
          ...orderData,
          status: 'pending',
        })
        .returning()

      console.log(`✅ Created order: ${order.id}`)

      // Publish event (simplified)
      const brokerClient = getBrokerClient()
      await brokerClient.publishOrderCreated({
        orderId: order.id,
        userId: order.userId,
        subscriptionPlan: order.subscriptionPlan,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
      })
      console.log(`📤 Published order.created event for: ${order.id}`)

      return order
    } catch (error) {
      console.error('❌ Error creating order:', error)
      throw error
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    })
    return order || null
  }

  /**
   * Get all orders with pagination and filtering
   */
  async getOrders(query?: {
    page?: number
    limit?: number
    status?: string
    userId?: string
  }): Promise<{
    orders: Order[]
    pagination: {
      page: number
      limit: number
      total: number
    }
  }> {
    const page = query?.page || 1
    const limit = query?.limit || 20
    const offset = (page - 1) * limit

    // Build where conditions
    const conditions: any[] = []
    if (query?.status) {
      conditions.push(eq(orders.status, query.status as any))
    }
    if (query?.userId) {
      conditions.push(eq(orders.userId, query.userId))
    }

    // Get total count
    const totalOrders = await db.query.orders.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
    })

    // Get paginated results
    const paginatedOrders = await db.query.orders.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      limit,
      offset,
    })

    return {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: totalOrders.length,
      },
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<{
    total: number
    pending: number
    completed: number
  }> {
    const allOrders = await db.query.orders.findMany()
    return {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      completed: allOrders.filter(o => o.status === 'completed').length,
    }
  }
}
