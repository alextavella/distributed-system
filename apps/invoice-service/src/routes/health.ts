import type { FastifyInstance } from 'fastify'
import { db } from '../db/connection.js'
import { invoiceEventConsumer } from '../services/invoice-event-consumer.js'

export async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check
  fastify.get('/health', async (request, reply) => {
    return reply.code(200).send({
      status: 'healthy',
      service: 'invoice-service',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    })
  })

  // Simple detailed health check
  fastify.get('/health/detailed', async (request, reply) => {
    try {
      // Check database
      await db.execute('SELECT 1')
      const dbStatus = 'healthy'

      // Check consumer
      const consumerStatus = invoiceEventConsumer.getStatus()

      return reply.code(200).send({
        status: 'healthy',
        service: 'invoice-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        dependencies: {
          database: { status: dbStatus },
          consumer: {
            status: consumerStatus.isConsuming ? 'healthy' : 'stopped',
          },
        },
      })
    } catch (error) {
      return reply.code(503).send({
        status: 'unhealthy',
        service: 'invoice-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        error: 'Service check failed',
      })
    }
  })
}
