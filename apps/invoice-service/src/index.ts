import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { initializeBrokerClient, shutdownBrokerClient } from '@streamflix/shared-broker'
import 'dotenv/config'
import Fastify from 'fastify'
import { healthRoutes } from './routes/health.js'
import { invoiceRoutes } from './routes/invoices.js'
import { invoiceEventConsumer } from './services/invoice-event-consumer.js'

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

// Setup function
async function setupFastify() {
  // Register CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  })

  // Register Helmet
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  })

  // Register Swagger
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Invoice Service API',
        description: 'Simple Invoice Service for Order Processing',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3002}`,
          description: 'Development server',
        },
      ],
    },
  })

  // Register Swagger UI
  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    staticCSP: true,
  })

  // Register routes
  await fastify.register(healthRoutes)
  await fastify.register(invoiceRoutes, { prefix: '/api' })

  // Simple error handler
  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error)
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
    })
  })
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...')
  try {
    await invoiceEventConsumer.stopConsuming()
    await shutdownBrokerClient()
    await fastify.close()
    process.exit(0)
  } catch (error) {
    console.error('Error during shutdown:', error)
    process.exit(1)
  }
})

process.on('SIGINT', async () => {
  console.log('Shutting down...')
  try {
    await invoiceEventConsumer.stopConsuming()
    await shutdownBrokerClient()
    await fastify.close()
    process.exit(0)
  } catch (error) {
    console.error('Error during shutdown:', error)
    process.exit(1)
  }
})

// Start server
const start = async () => {
  try {
    // Setup Fastify
    await setupFastify()

    // Initialize broker client
    console.log('🔌 Initializing broker...')
    await initializeBrokerClient()

    // Start consumer
    console.log('🎧 Starting consumer...')
    await invoiceEventConsumer.startConsuming()

    // Start server
    const host = process.env.HOST || '0.0.0.0'
    const port = parseInt(process.env.PORT || '3002')

    await fastify.listen({ host, port })

    console.log(`🚀 Invoice Service running at http://${host}:${port}`)
    console.log(`📚 Docs available at http://${host}:${port}/docs`)
    console.log(`🏥 Health check at http://${host}:${port}/health`)
  } catch (err) {
    console.error('❌ Failed to start service:', err)
    process.exit(1)
  }
}

start()