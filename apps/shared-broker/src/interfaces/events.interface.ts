/**
 * Base event interface
 * All domain events should extend this interface
 */
export interface BaseEvent {
  eventId: string
  eventType: string
  timestamp: string
  version: string
  correlationId?: string
}

/**
 * Domain event specific to orders
 */
export interface OrderCreatedEvent extends BaseEvent {
  eventType: 'order.created'
  data: {
    orderId: string
    userId: string
    subscriptionPlan: string
    amount: string
    currency: string
    status: string
  }
}

/**
 * Event factory interface
 * Follows the Factory Pattern and Single Responsibility Principle
 */
export interface IEventFactory {
  createOrderCreatedEvent(orderData: {
    orderId: string
    userId: string
    subscriptionPlan: string
    amount: string
    currency: string
    status: string
  }): OrderCreatedEvent
}

/**
 * Event dispatcher interface
 * Follows the Single Responsibility Principle
 */
export interface IEventDispatcher {
  dispatch<T extends BaseEvent>(event: T): Promise<void>
}
