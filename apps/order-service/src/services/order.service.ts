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
   * Get all orders (simple list)
   */
  async getOrders(): Promise<Order[]> {
    return await db.query.orders.findMany({
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    })
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
