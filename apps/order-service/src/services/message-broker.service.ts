import amqp, { Channel, Connection } from 'amqplib'

export interface OrderCreatedEvent {
  orderId: string
  userId: string
  subscriptionPlan: string
  amount: string
  currency: string
  status: string
  createdAt: string
}

export class MessageBrokerService {
  private connection: Connection | null = null
  private channel: Channel | null = null
  private readonly exchangeName = 'order-events'
  private readonly queueName = 'order-created'

  async connect(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672'

      this.connection = await amqp.connect(rabbitmqUrl)
      this.channel = await this.connection.createChannel()

      // Declare exchange
      await this.channel.assertExchange(this.exchangeName, 'direct', {
        durable: true,
      })

      // Declare queue
      await this.channel.assertQueue(this.queueName, {
        durable: true,
      })

      // Bind queue to exchange
      await this.channel.bindQueue(
        this.queueName,
        this.exchangeName,
        'order.created',
      )

      console.log('✅ Connected to RabbitMQ')
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error)
      throw error
    }
  }

  async publishOrderCreatedEvent(event: OrderCreatedEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized')
    }

    try {
      const message = JSON.stringify(event)

      await this.channel.publish(
        this.exchangeName,
        'order.created',
        Buffer.from(message),
        {
          persistent: true,
          timestamp: Date.now(),
          messageId: event.orderId,
        },
      )

      console.log(
        `📤 Published order created event for order: ${event.orderId}`,
      )
    } catch (error) {
      console.error('❌ Failed to publish order created event:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close()
      }
      if (this.connection) {
        await this.connection.close()
      }
      console.log('✅ Disconnected from RabbitMQ')
    } catch (error) {
      console.error('❌ Error disconnecting from RabbitMQ:', error)
    }
  }
}

// Singleton instance
export const messageBrokerService = new MessageBrokerService()
