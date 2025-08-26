/**
 * Interface for message broker connection management
 * Follows the Interface Segregation Principle (ISP)
 */
export interface IMessageBrokerConnection {
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
}

/**
 * Interface for publishing events
 * Follows the Single Responsibility Principle (SRP)
 */
export interface IEventPublisher {
  publish<T extends Record<string, any>>(
    exchange: string,
    routingKey: string,
    event: T,
    options?: PublishOptions,
  ): Promise<void>
}

/**
 * Interface for consuming events
 * Follows the Single Responsibility Principle (SRP)
 */
export interface IEventConsumer {
  subscribe<T extends Record<string, any>>(
    queue: string,
    routingKey: string,
    handler: EventHandler<T>,
    options?: ConsumeOptions,
  ): Promise<void>
}

/**
 * Options for publishing messages
 */
export interface PublishOptions {
  persistent?: boolean
  messageId?: string
  correlationId?: string
  timestamp?: number
  headers?: Record<string, any>
  contentType?: string
  contentEncoding?: string
}

/**
 * Options for consuming messages
 */
export interface ConsumeOptions {
  autoAck?: boolean
  exclusive?: boolean
  durable?: boolean
  prefetch?: number
}

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (
  event: T,
  metadata: EventMetadata,
) => Promise<void>

/**
 * Event metadata provided to handlers
 */
export interface EventMetadata {
  deliveryTag: number
  redelivered: boolean
  exchange: string
  routingKey: string
  messageId?: string
  correlationId?: string
  timestamp?: Date
  headers?: Record<string, any>
}
