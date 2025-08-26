import {
  ConsumeOptions,
  EventHandler,
  EventMetadata,
  IEventConsumer,
} from '../interfaces/message-broker.interface.js'
import { RabbitMQConnection } from './rabbitmq-connection.js'

/**
 * RabbitMQ event consumer implementation
 * Follows the Single Responsibility Principle - only consumes events
 * Follows the Dependency Inversion Principle - depends on abstraction (IMessageBrokerConnection)
 */
export class RabbitMQEventConsumer implements IEventConsumer {
  constructor(private readonly connection: RabbitMQConnection) {}

  async subscribe<T extends Record<string, any>>(
    queue: string,
    routingKey: string,
    handler: EventHandler<T>,
    options: ConsumeOptions = {},
  ): Promise<void> {
    if (!this.connection.isConnected()) {
      throw new Error('RabbitMQ connection not established')
    }

    try {
      const channel = this.connection.getChannel()

      // Ensure queue exists
      await channel.assertQueue(queue, {
        durable: options.durable ?? true,
        exclusive: options.exclusive ?? false,
      })

      // Bind queue to exchange with routing key
      await channel.bindQueue(queue, 'order-events', routingKey)

      // Set prefetch if specified
      if (options.prefetch) {
        await channel.prefetch(options.prefetch)
      }

      console.log(
        `🎧 Starting to consume from queue '${queue}' with routing key '${routingKey}'`,
      )

      // Start consuming
      await channel.consume(
        queue,
        async msg => {
          if (!msg) {
            console.log('⚠️ Received empty message')
            return
          }

          try {
            const content = msg.content.toString()
            const event: T = JSON.parse(content)

            const metadata: EventMetadata = {
              deliveryTag: msg.fields.deliveryTag,
              redelivered: msg.fields.redelivered,
              exchange: msg.fields.exchange,
              routingKey: msg.fields.routingKey,
            }

            // Add optional properties only if they exist
            if (msg.properties.messageId) {
              metadata.messageId = msg.properties.messageId
            }
            if (msg.properties.correlationId) {
              metadata.correlationId = msg.properties.correlationId
            }
            if (msg.properties.timestamp) {
              metadata.timestamp = new Date(msg.properties.timestamp)
            }
            if (msg.properties.headers) {
              metadata.headers = msg.properties.headers as Record<string, any>
            }

            console.log(
              `📨 Received event from queue '${queue}': ${event.eventType || 'unknown'}`,
            )

            await handler(event, metadata)

            // Acknowledge message if auto-ack is disabled
            if (!options.autoAck) {
              channel.ack(msg)
            }

            console.log(`✅ Successfully processed event from queue '${queue}'`)
          } catch (error) {
            console.error(
              `❌ Error processing message from queue '${queue}':`,
              error,
            )

            // Reject message and don't requeue on processing error
            if (!options.autoAck) {
              channel.nack(msg, false, false)
            }
          }
        },
        {
          noAck: options.autoAck ?? false,
        },
      )

      console.log(`✅ Consumer started for queue '${queue}'`)
    } catch (error) {
      console.error(`❌ Failed to start consumer for queue '${queue}':`, error)
      throw error
    }
  }
}
