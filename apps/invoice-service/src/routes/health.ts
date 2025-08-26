import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { db } from '../db/connection.js'
import { invoiceEventConsumer } from '../services/invoice-event-consumer.js'
import {
  DetailedHealthResponse,
  HealthErrorResponse,
  HealthResponse,
  ReadinessResponse,
} from '../types/health.js'

export async function healthRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  // Basic health check
  app.get(
    '/health',
    {
      schema: {
        description: 'Basic health check endpoint',
        tags: ['health'],
        summary: 'Basic Health Check',
        response: {
          200: HealthResponse,
        },
      },
    },
    async (_request, reply) => {
      return reply.code(200).send({
        status: 'healthy',
        service: 'invoice-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      })
    },
  )

  // Detailed health check with dependencies
  app.get(
    '/health/detailed',
    {
      schema: {
        description: 'Detailed health check including all dependencies',
        tags: ['health'],
        summary: 'Detailed Health Check',
        response: {
          200: DetailedHealthResponse,
          503: HealthErrorResponse,
        },
      },
    },
    async (_request, reply) => {
      const checks = {
        database: await checkDatabase(),
        eventConsumer: checkEventConsumer(),
      }

      const allHealthy = Object.values(checks).every(
        check => check.status === 'healthy',
      )

      return reply.code(allHealthy ? 200 : 503).send({
        status: allHealthy ? 'healthy' : 'unhealthy',
        service: 'invoice-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        dependencies: checks,
      })
    },
  )

  // Readiness check
  app.get(
    '/ready',
    {
      schema: {
        description: 'Readiness check for container orchestration',
        tags: ['health'],
        summary: 'Readiness Check',
        response: {
          200: ReadinessResponse,
          503: ReadinessResponse,
        },
      },
    },
    async (_request, reply) => {
      try {
        const dbCheck = await checkDatabase()

        if (dbCheck.status !== 'healthy') {
          return reply.code(503).send({
            status: 'not ready',
            ready: false,
            error: 'Database connection failed',
          })
        }

        return reply.code(200).send({
          status: 'ready',
          ready: true,
        })
      } catch (error) {
        return reply.code(503).send({
          status: 'not ready',
          ready: false,
          error: 'Service initialization failed',
        })
      }
    },
  )
}

async function checkDatabase(): Promise<{
  status: 'healthy' | 'unhealthy'
  responseTime?: number
}> {
  const startTime = Date.now()
  try {
    await db.execute('SELECT 1')
    const responseTime = Date.now() - startTime
    return { status: 'healthy', responseTime }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('Database health check failed:', error)
    return { status: 'unhealthy', responseTime }
  }
}

function checkEventConsumer(): {
  status: 'healthy' | 'unhealthy'
  isConsuming: boolean
} {
  const consumerStatus = invoiceEventConsumer.getStatus()
  return {
    status: consumerStatus.isConsuming ? 'healthy' : 'unhealthy',
    isConsuming: consumerStatus.isConsuming,
  }
}
