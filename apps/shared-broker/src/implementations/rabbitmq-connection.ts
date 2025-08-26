import amqp from 'amqplib'
import type { BrokerConfig } from '../config/broker.config.js'
import { IMessageBrokerConnection } from '../interfaces/message-broker.interface.js'

/**
 * RabbitMQ connection manager
 * Follows the Single Responsibility Principle - manages only connection lifecycle
 */
export class RabbitMQConnection implements IMessageBrokerConnection {
  private connection: amqp.ChannelModel | null = null
  private channel: amqp.Channel | null = null

  constructor(private readonly config: BrokerConfig) {}

  async connect(): Promise<void> {
    try {
      if (this.isConnected()) {
        return
      }

      console.log('🔌 Connecting to RabbitMQ...')
      this.connection = await amqp.connect(
        this.config.url,
        this.config.connectionOptions,
      )

      this.channel = await this.connection.createChannel()

      // Setup error handlers
      this.connection?.on('error', this.handleConnectionError.bind(this))
      this.connection?.on('close', this.handleConnectionClose.bind(this))
      this.channel?.on('error', this.handleChannelError.bind(this))

      // Setup exchanges and queues
      await this.setupInfrastructure()

      console.log('✅ Connected to RabbitMQ')
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close()
        this.channel = null
      }

      if (this.connection) {
        await this.connection.close()
        this.connection = null
      }

      console.log('✅ Disconnected from RabbitMQ')
    } catch (error) {
      console.error('❌ Error disconnecting from RabbitMQ:', error)
    }
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null
  }

  getChannel(): amqp.Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized. Call connect() first.')
    }
    return this.channel
  }

  private async setupInfrastructure(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not available')
    }

    // Create exchanges
    for (const exchange of this.config.exchanges) {
      await this.channel.assertExchange(
        exchange.name,
        exchange.type,
        exchange.options,
      )
      console.log(`📡 Exchange '${exchange.name}' ready`)
    }

    // Create queues and bindings
    for (const queue of this.config.queues) {
      await this.channel.assertQueue(queue.name, queue.options)
      console.log(`📬 Queue '${queue.name}' ready`)

      // Bind queue to exchanges
      if (queue.bindings) {
        for (const binding of queue.bindings) {
          await this.channel.bindQueue(
            queue.name,
            binding.exchange,
            binding.routingKey,
          )
          console.log(
            `🔗 Bound '${queue.name}' to '${binding.exchange}' with key '${binding.routingKey}'`,
          )
        }
      }
    }
  }

  private handleConnectionError(error: Error): void {
    console.error('🚨 RabbitMQ connection error:', error)
  }

  private handleConnectionClose(): void {
    console.warn('⚠️  RabbitMQ connection closed')
    this.connection = null
    this.channel = null
  }

  private handleChannelError(error: Error): void {
    console.error('🚨 RabbitMQ channel error:', error)
  }
}
