import { randomUUID } from 'node:crypto'
import {
  IEventFactory,
  OrderCreatedEvent,
} from '../interfaces/events.interface.js'

/**
 * Event factory implementation
 * Follows the Factory Pattern and Single Responsibility Principle
 * Creates domain events with consistent structure and metadata
 */
export class EventFactory implements IEventFactory {
  private readonly version = '1.0.0'

  createOrderCreatedEvent(orderData: {
    orderId: string
    userId: string
    subscriptionPlan: string
    amount: string
    currency: string
    status: string
  }): OrderCreatedEvent {
    return {
      eventId: randomUUID(),
      eventType: 'order.created',
      timestamp: new Date().toISOString(),
      version: this.version,
      data: {
        orderId: orderData.orderId,
        userId: orderData.userId,
        subscriptionPlan: orderData.subscriptionPlan,
        amount: orderData.amount,
        currency: orderData.currency,
        status: orderData.status,
      },
    }
  }
}
