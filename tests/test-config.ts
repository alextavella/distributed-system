import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables for testing
config({ path: resolve(__dirname, '../apps/order-service/.env.local') })

export const testConfig = {
  database: {
    url:
      process.env.TEST_DATABASE_URL ||
      process.env.DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/orders_test_db',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  },
  service: {
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST || '0.0.0.0',
  },
}

export const setupTestEnvironment = () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = testConfig.database.url
  process.env.RABBITMQ_URL = testConfig.rabbitmq.url
}
