import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import 'dotenv/config'
import Fastify from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { orderRoutes } from './routes/orders.js'
import { messageBrokerService } from './services/message-broker.service.js'

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

// Add schema validator and serializer
fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)

// Register plugins
await fastify.register(helmet, {
  contentSecurityPolicy: false,
})

await fastify.register(cors, {
  origin: true,
  credentials: true,
})

// Swagger documentation
await fastify.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Order Service API',
      description: 'StreamFlix Order Management Service',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
})

await fastify.register(swaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  staticCSP: true,
  transformSpecificationClone: true,
})

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'order-service',
    version: '1.0.0',
  }
})

// Register routes
await fastify.register(orderRoutes, { prefix: '/api/orders' })

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)

  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.code(400).send({
      success: false,
      error: 'Validation Error',
      message: "Request doesn't match the schema",
      statusCode: 400,
      details: {
        issues: error.validation,
        method: request.method,
        url: request.url,
      },
    })
  }

  if (isResponseSerializationError(error)) {
    return reply.code(500).send({
      success: false,
      error: 'Internal Server Error',
      message: "Response doesn't match the schema",
      statusCode: 500,
      details: {
        issues: (error.cause as any)?.issues || [],
        method: request.method,
        url: request.url,
      },
    })
  }

  reply.status(500).send({
    success: false,
    error: 'Internal server error',
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, shutting down gracefully')
  await messageBrokerService.disconnect()
  await fastify.close()
})

process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, shutting down gracefully')
  await messageBrokerService.disconnect()
  await fastify.close()
})

// Start server
const start = async () => {
  try {
    // Initialize RabbitMQ connection
    await messageBrokerService.connect()

    const host = process.env.HOST || '0.0.0.0'
    const port = parseInt(process.env.PORT || '3001')

    await fastify.listen({ host, port })

    fastify.log.info(`🚀 Order Service running at http://${host}:${port}`)
    fastify.log.info(
      `📚 API Documentation available at http://${host}:${port}/docs`,
    )
  } catch (err) {
    fastify.log.error(err)
    await messageBrokerService.disconnect()
    process.exit(1)
  }
}

start()
