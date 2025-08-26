import { BrokerConfig, defaultBrokerConfig } from './config/broker.config.js'
import { EventDispatcher } from './events/event-dispatcher.js'
import { EventFactory } from './events/event-factory.js'
import { RabbitMQConnection } from './implementations/rabbitmq-connection.js'
import { RabbitMQEventPublisher } from './implementations/rabbitmq-event-publisher.js'
import {
  IEventDispatcher,
  IEventFactory,
} from './interfaces/events.interface.js'
import { IMessageBrokerConnection } from './interfaces/message-broker.interface.js'

/**
 * Main broker client that orchestrates all messaging components
 * Follows the Facade Pattern and Dependency Injection principles
 * Provides a simple interface for the application layer
 */
export class BrokerClient {
  private readonly connection: IMessageBrokerConnection
  private readonly eventFactory: IEventFactory
  private readonly eventDispatcher: IEventDispatcher

  constructor(config: BrokerConfig = defaultBrokerConfig) {
    // Create instances following Dependency Injection pattern
    this.connection = new RabbitMQConnection(config)
    const eventPublisher = new RabbitMQEventPublisher(
      this.connection as RabbitMQConnection,
    )
    this.eventFactory = new EventFactory()
    this.eventDispatcher = new EventDispatcher(eventPublisher)
  }

  /**
   * Initialize the broker connection and infrastructure
   */
  async connect(): Promise<void> {
    await this.connection.connect()
  }

  /**
   * Disconnect from the broker
   */
  async disconnect(): Promise<void> {
    await this.connection.disconnect()
  }

  /**
   * Check if broker is connected
   */
  isConnected(): boolean {
    return this.connection.isConnected()
  }

  /**
   * Get event factory for creating domain events
   */
  getEventFactory(): IEventFactory {
    return this.eventFactory
  }

  /**
   * Get event dispatcher for publishing events
   */
  getEventDispatcher(): IEventDispatcher {
    return this.eventDispatcher
  }

  /**
   * Convenience method to publish order created event
   */
  async publishOrderCreated(orderData: {
    orderId: string
    userId: string
    subscriptionPlan: string
    amount: string
    currency: string
    status: string
  }): Promise<void> {
    const event = this.eventFactory.createOrderCreatedEvent(orderData)
    await this.eventDispatcher.dispatch(event)
  }
}

// Singleton instance for the application
let brokerClientInstance: BrokerClient | null = null

/**
 * Get the singleton broker client instance
 * Follows the Singleton Pattern
 */
export function getBrokerClient(): BrokerClient {
  if (!brokerClientInstance) {
    brokerClientInstance = new BrokerClient()
  }
  return brokerClientInstance
}

/**
 * Initialize the broker client (call this on application startup)
 */
export async function initializeBrokerClient(): Promise<void> {
  const client = getBrokerClient()
  await client.connect()
}

/**
 * Shutdown the broker client (call this on application shutdown)
 */
export async function shutdownBrokerClient(): Promise<void> {
  if (brokerClientInstance) {
    await brokerClientInstance.disconnect()
    brokerClientInstance = null
  }
}
