import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { OrderService } from '../services/order.service.js'
import {
  CreateOrderBodySchema,
  ErrorResponseSchema,
  OrderIdParamsSchema,
  OrderResponseSchema,
  OrdersListResponseSchema,
  OrdersQuerySchema,
  OrderStatsResponseSchema,
  UpdateOrderStatusBodySchema,
} from '../types/order.js'

export async function orderRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()
  const orderService = new OrderService()

  // Create order
  app.post(
    '/orders',
    {
      schema: {
        description: 'Create a new order',
        tags: ['orders'],
        summary: 'Create Order',
        body: CreateOrderBodySchema,
        response: {
          201: OrderResponseSchema,
          400: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const orderData = request.body
        const order = await orderService.createOrder(orderData)

        return reply.code(201).send({
          id: order.id,
          userId: order.userId,
          subscriptionPlan: order.subscriptionPlan,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          paymentMethod: order.paymentMethod,
          transactionId: order.transactionId,
          metadata: order.metadata,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })
      } catch (error) {
        console.error('Error creating order:', error)
        return reply.code(500).send({
          error: 'Failed to create order',
        })
      }
    },
  )

  // Get order by ID
  app.get(
    '/orders/:id',
    {
      schema: {
        description: 'Get order by ID',
        tags: ['orders'],
        summary: 'Get Order by ID',
        params: OrderIdParamsSchema,
        response: {
          200: OrderResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const order = await orderService.getOrderById(id)

        if (!order) {
          return reply.code(404).send({
            error: 'Order not found',
          })
        }

        return reply.code(200).send({
          id: order.id,
          userId: order.userId,
          subscriptionPlan: order.subscriptionPlan,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          paymentMethod: order.paymentMethod,
          transactionId: order.transactionId,
          metadata: order.metadata,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })
      } catch (error) {
        console.error('Error getting order:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )

  // Get all orders
  app.get(
    '/orders',
    {
      schema: {
        description: 'List orders with pagination and filtering',
        tags: ['orders'],
        summary: 'List Orders',
        querystring: OrdersQuerySchema,
        response: {
          200: OrdersListResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const query = request.query
        const result = await orderService.getOrders(query)

        return reply.code(200).send({
          orders: result.orders.map(order => ({
            id: order.id,
            userId: order.userId,
            subscriptionPlan: order.subscriptionPlan,
            amount: order.amount,
            currency: order.currency,
            status: order.status,
            paymentMethod: order.paymentMethod,
            transactionId: order.transactionId,
            metadata: order.metadata,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          })),
          pagination: result.pagination,
        })
      } catch (error) {
        console.error('Error listing orders:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )

  // Update order status
  app.patch(
    '/orders/:id/status',
    {
      schema: {
        description: 'Update order status',
        tags: ['orders'],
        summary: 'Update Order Status',
        body: UpdateOrderStatusBodySchema,
        params: OrderIdParamsSchema,
        response: {
          200: OrderResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const statusData = request.body
        const order = await orderService.updateOrderStatus(id, statusData)

        return reply.code(200).send({
          id: order.id,
          userId: order.userId,
          subscriptionPlan: order.subscriptionPlan,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          paymentMethod: order.paymentMethod,
          transactionId: order.transactionId,
          metadata: order.metadata,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })
      } catch (error) {
        console.error('Error updating order status:', error)
        if (error instanceof Error && error.message === 'Order not found') {
          return reply.code(404).send({
            error: 'Order not found',
          })
        }
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )

  // Get order statistics
  app.get(
    '/orders/stats',
    {
      schema: {
        description: 'Get order statistics',
        tags: ['orders'],
        summary: 'Get Order Statistics',
        response: {
          200: OrderStatsResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const stats = await orderService.getOrderStats()
        return reply.code(200).send(stats)
      } catch (error) {
        console.error('Error getting order stats:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )
}
