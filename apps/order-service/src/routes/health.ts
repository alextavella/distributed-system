import { getBrokerClient } from '@streamflix/shared-broker'
import type { FastifyInstance } from 'fastify'
import { db } from '../db/connection.js'

export async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check
  fastify.get('/health', async (request, reply) => {
    return reply.code(200).send({
      status: 'healthy',
      service: 'order-service',
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

      // Check broker
      const brokerClient = getBrokerClient()
      const brokerStatus = brokerClient.isConnected()
        ? 'healthy'
        : 'disconnected'

      return reply.code(200).send({
        status: 'healthy',
        service: 'order-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        dependencies: {
          database: { status: dbStatus },
          broker: { status: brokerStatus },
        },
      })
    } catch (error) {
      return reply.code(503).send({
        status: 'unhealthy',
        service: 'order-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        error: 'Service check failed',
      })
    }
  })
}
