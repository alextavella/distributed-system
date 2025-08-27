import { FastifyInstance } from 'fastify'
import { NotFoundError } from '../errors/http-errors.js'
import { createOrderService } from '../factories/order-service.factory.js'
import {
  CreateOrderBodySchema,
  OrderIdParamsSchema,
  OrdersQuerySchema,
  UpdateOrderStatusBodySchema,
  type CreateOrderData,
  type OrdersQuery,
  type UpdateOrderStatusData,
} from '../types/order.js'

export async function orderRoutes(app: FastifyInstance) {
  const orderService = createOrderService()

  app.post(
    '/orders',
    {
      schema: {
        body: CreateOrderBodySchema,
      },
    },
    async (request, reply) => {
      const orderData = request.body as CreateOrderData
      const order = await orderService.createOrder(orderData)

      return reply.status(201).send(order)
    },
  )

  app.get(
    '/orders',
    {
      schema: {
        querystring: OrdersQuerySchema,
      },
    },
    async (request, reply) => {
      const query = request.query as OrdersQuery
      const result = await orderService.getOrders({
        page: query.page,
        limit: query.limit,
        status: query.status,
        userId: query.userId,
      })

      return reply.send(result)
    },
  )

  app.get(
    '/orders/:id',
    {
      schema: {
        params: OrderIdParamsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const order = await orderService.getOrderById(id)

      if (!order) {
        throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND')
      }

      return reply.send(order)
    },
  )

  app.patch(
    '/orders/:id/status',
    {
      schema: {
        params: OrderIdParamsSchema,
        body: UpdateOrderStatusBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { status } = request.body as UpdateOrderStatusData

      const order = await orderService.updateOrderStatus(id, status)

      return reply.send(order)
    },
  )

  app.get('/orders/stats', async (_request, reply) => {
    const stats = await orderService.getOrderStats()
    return reply.send(stats)
  })
}
