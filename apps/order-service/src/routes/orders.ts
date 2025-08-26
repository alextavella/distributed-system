import type { FastifyInstance } from 'fastify'
import { OrderService } from '../services/order.service.js'
import {
  CreateOrderSchema,
  ErrorResponseSchema,
  OrderResponseSchema,
} from '../types/order.js'

const orderService = new OrderService()

export async function orderRoutes(fastify: FastifyInstance) {
  // Create order
  fastify.post('/', {
    schema: {
      description: 'Create a new order',
      tags: ['orders'],
      body: CreateOrderSchema,
      response: {
        201: OrderResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const order = await orderService.createOrder(request.body as any)

        reply.status(201).send({
          success: true,
          data: order,
        })
      } catch (error) {
        fastify.log.error(error)
        reply.status(500).send({
          success: false,
          error: 'Failed to create order',
        })
      }
    },
  })
}
