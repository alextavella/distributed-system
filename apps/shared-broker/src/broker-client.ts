import { BrokerConfig, defaultBrokerConfig } from './config/broker.config.js'
import { EventDispatcher } from './events/event-dispatcher.js'
import { EventFactory } from './events/event-factory.js'
import { RabbitMQConnection } from './implementations/rabbitmq-connection.js'
import { RabbitMQEventConsumer } from './implementations/rabbitmq-event-consumer.js'
import { RabbitMQEventPublisher } from './implementations/rabbitmq-event-publisher.js'
import {
  IEventDispatcher,
  IEventFactory,
} from './interfaces/events.interface.js'
import {
  ConsumeOptions,
  EventHandler,
  IEventConsumer,
  IMessageBrokerConnection,
} from './interfaces/message-broker.interface.js'

/**
 * Main broker client that orchestrates all messaging components
 * Follows the Facade Pattern and Dependency Injection principles
 * Provides a simple interface for the application layer
 */
export class BrokerClient {
  private readonly connection: IMessageBrokerConnection
  private readonly eventFactory: IEventFactory
  private readonly eventDispatcher: IEventDispatcher
  private readonly eventConsumer: IEventConsumer

  constructor(config: BrokerConfig = defaultBrokerConfig) {
    // Create instances following Dependency Injection pattern
    this.connection = new RabbitMQConnection(config)
    const eventPublisher = new RabbitMQEventPublisher(
      this.connection as RabbitMQConnection,
    )
    this.eventFactory = new EventFactory()
    this.eventDispatcher = new EventDispatcher(eventPublisher)
    this.eventConsumer = new RabbitMQEventConsumer(
      this.connection as RabbitMQConnection,
    )
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
    amount: number
    currency: string
    status: string
  }): Promise<void> {
    const event = this.eventFactory.createOrderCreatedEvent(orderData)
    await this.eventDispatcher.dispatch(event)
  }

  /**
   * Subscribe to events with a handler
   */
  async subscribeToEvents<T extends Record<string, any>>(
    queue: string,
    routingKey: string,
    handler: EventHandler<T>,
    options?: ConsumeOptions,
  ): Promise<void> {
    await this.eventConsumer.subscribe(queue, routingKey, handler, options)
  }

  /**
   * Convenience method to subscribe to order created events
   */
  async subscribeToOrderCreated(
    handler: EventHandler<any>,
    options?: ConsumeOptions,
  ): Promise<void> {
    await this.eventConsumer.subscribe(
      'invoice-service-orders',
      'order.created',
      handler,
      options,
    )
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
export async function initializeBrokerClient(
  config?: Partial<BrokerConfig>,
): Promise<void> {
  if (config) {
    // Create a new instance with custom config
    brokerClientInstance = new BrokerClient({
      ...defaultBrokerConfig,
      ...config,
      url: config.url || defaultBrokerConfig.url,
    })
  } else {
    // Use default config
    brokerClientInstance = new BrokerClient()
  }

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
