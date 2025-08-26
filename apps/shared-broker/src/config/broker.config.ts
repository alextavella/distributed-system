/**
 * RabbitMQ broker configuration
 * Centralized configuration following the Single Responsibility Principle
 */
export interface BrokerConfig {
  url: string
  exchanges: ExchangeConfig[]
  queues: QueueConfig[]
  connectionOptions?: ConnectionOptions
}

export interface ExchangeConfig {
  name: string
  type: 'direct' | 'fanout' | 'topic' | 'headers'
  options?: {
    durable?: boolean
    autoDelete?: boolean
    arguments?: Record<string, any>
  }
}

export interface QueueConfig {
  name: string
  options?: {
    durable?: boolean
    exclusive?: boolean
    autoDelete?: boolean
    arguments?: Record<string, any>
  }
  bindings?: {
    exchange: string
    routingKey: string
  }[]
}

export interface ConnectionOptions {
  heartbeat?: number
  connectionTimeout?: number
  channelMax?: number
  frameMax?: number
}

/**
 * Default broker configuration for the order service
 */
export const defaultBrokerConfig: BrokerConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  exchanges: [
    {
      name: 'order-events',
      type: 'direct',
      options: {
        durable: true,
        autoDelete: false,
      },
    },
  ],
  queues: [
    {
      name: 'order-created',
      options: {
        durable: true,
        exclusive: false,
        autoDelete: false,
      },
      bindings: [
        {
          exchange: 'order-events',
          routingKey: 'order.created',
        },
      ],
    },
  ],
  connectionOptions: {
    heartbeat: 60,
    connectionTimeout: 30000,
  },
}
