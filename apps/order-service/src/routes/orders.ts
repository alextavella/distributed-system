import type { FastifyInstance } from 'fastify'
import { OrderService } from '../services/order.service.js'

export async function orderRoutes(fastify: FastifyInstance) {
  const orderService = new OrderService()

  // Create a new order (simplified)
  fastify.post('/orders', async (request, reply) => {
    try {
      const orderData = request.body as {
        userId: string
        subscriptionPlan: string
        amount: string
        currency: string
      }

      // Simple validation
      if (!orderData.userId || !orderData.subscriptionPlan || !orderData.amount || !orderData.currency) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: userId, subscriptionPlan, amount, currency',
        })
      }

      const order = await orderService.createOrder(orderData)

      return reply.code(201).send({
        success: true,
        data: order,
      })
    } catch (error) {
      console.error('Error creating order:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to create order',
      })
    }
  })

  // Get all orders
  fastify.get('/orders', async (request, reply) => {
    try {
      const orders = await orderService.getOrders()
      return reply.code(200).send({
        success: true,
        data: orders,
      })
    } catch (error) {
      console.error('Error fetching orders:', error)
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      })
    }
  })

  // Get order by ID
  fastify.get('/orders/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const order = await orderService.getOrderById(id)

      if (!order) {
        return reply.code(404).send({
          success: false,
          error: 'Order not found',
        })
      }

      return reply.code(200).send({
        success: true,
        data: order,
      })
    } catch (error) {
      console.error('Error fetching order:', error)
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      })
    }
  })

  // Get order statistics
  fastify.get('/orders/stats', async (request, reply) => {
    try {
      const stats = await orderService.getOrderStats()
      return reply.code(200).send({
        success: true,
        data: stats,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      })
    }
  })
}