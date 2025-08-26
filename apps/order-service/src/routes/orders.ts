import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { OrderService } from '../services/order.service.js'
import {
  CreateOrderBody,
  ErrorResponse,
  OrderIdParams,
  OrderResponse,
  OrdersListResponse,
  OrdersQuery,
  OrderStatsResponse,
} from '../types/order.js'

export async function orderRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()
  const orderService = new OrderService()

  // Create a new order
  app.post(
    '/orders',
    {
      schema: {
        description: 'Create a new order',
        tags: ['orders'],
        summary: 'Create Order',
        body: CreateOrderBody,
        response: {
          201: OrderResponse,
          400: ErrorResponse,
          500: ErrorResponse,
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
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        })
      } catch (error) {
        console.error('Error creating order:', error)
        return reply.code(500).send({
          error: 'Failed to create order',
        })
      }
    },
  )

  // List orders with pagination and filtering
  app.get(
    '/orders',
    {
      schema: {
        description: 'List orders with pagination and optional filtering',
        tags: ['orders'],
        summary: 'List Orders',
        querystring: OrdersQuery,
        response: {
          200: OrdersListResponse,
          500: ErrorResponse,
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
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
          })),
          pagination: result.pagination,
        })
      } catch (error) {
        console.error('Error fetching orders:', error)
        return reply.code(500).send({
          error: 'Internal server error',
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
        params: OrderIdParams,
        response: {
          200: OrderResponse,
          404: ErrorResponse,
          500: ErrorResponse,
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
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        })
      } catch (error) {
        console.error('Error fetching order:', error)
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
        description: 'Get order statistics and counts',
        tags: ['orders'],
        summary: 'Get Order Statistics',
        response: {
          200: OrderStatsResponse,
          500: ErrorResponse,
        },
      },
    },
    async (_request, reply) => {
      try {
        const stats = await orderService.getOrderStats()
        return reply.code(200).send(stats)
      } catch (error) {
        console.error('Error fetching stats:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )
}
