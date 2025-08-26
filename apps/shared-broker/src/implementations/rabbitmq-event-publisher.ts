import {
  IEventPublisher,
  PublishOptions,
} from '../interfaces/message-broker.interface.js'
import { RabbitMQConnection } from './rabbitmq-connection.js'

/**
 * RabbitMQ event publisher implementation
 * Follows the Single Responsibility Principle - only publishes events
 * Follows the Dependency Inversion Principle - depends on abstraction (IMessageBrokerConnection)
 */
export class RabbitMQEventPublisher implements IEventPublisher {
  constructor(private readonly connection: RabbitMQConnection) {}

  async publish<T extends Record<string, any>>(
    exchange: string,
    routingKey: string,
    event: T,
    options: PublishOptions = {},
  ): Promise<void> {
    if (!this.connection.isConnected()) {
      throw new Error('RabbitMQ connection not established')
    }

    try {
      const channel = this.connection.getChannel()
      const message = JSON.stringify(event)

      const publishOptions = {
        persistent: options.persistent ?? true,
        messageId: options.messageId ?? event.eventId ?? undefined,
        correlationId:
          options.correlationId ?? event.correlationId ?? undefined,
        timestamp: options.timestamp ?? Date.now(),
        headers: options.headers ?? {},
        contentType: options.contentType ?? 'application/json',
        contentEncoding: options.contentEncoding ?? 'utf8',
      }

      const success = channel.publish(
        exchange,
        routingKey,
        Buffer.from(message),
        publishOptions,
      )

      if (!success) {
        throw new Error('Failed to publish message - channel buffer full')
      }

      console.log(
        `📤 Published event to exchange '${exchange}' with routing key '${routingKey}'`,
      )
    } catch (error) {
      console.error('❌ Failed to publish event:', error)
      throw error
    }
  }
}
