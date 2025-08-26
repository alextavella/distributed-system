import { BaseEvent, IEventDispatcher } from '../interfaces/events.interface.js'
import { IEventPublisher } from '../interfaces/message-broker.interface.js'

/**
 * Event dispatcher implementation
 * Follows the Single Responsibility Principle - dispatches events to appropriate channels
 * Follows the Open/Closed Principle - easy to extend with new event types
 */
export class EventDispatcher implements IEventDispatcher {
  constructor(private readonly eventPublisher: IEventPublisher) {}

  async dispatch<T extends BaseEvent>(event: T): Promise<void> {
    try {
      const { exchange, routingKey } = this.getEventRouting(event)

      const publishOptions: any = {
        messageId: event.eventId,
        contentType: 'application/json',
        headers: {
          eventType: event.eventType,
          version: event.version,
        },
      }

      if (event.correlationId) {
        publishOptions.correlationId = event.correlationId
      }

      await this.eventPublisher.publish(
        exchange,
        routingKey,
        event,
        publishOptions,
      )

      console.log(`🚀 Dispatched event: ${event.eventType} (${event.eventId})`)
    } catch (error) {
      console.error(`❌ Failed to dispatch event: ${event.eventType}`, error)
      throw error
    }
  }

  /**
   * Maps event types to their routing configuration
   * Follows the Single Responsibility Principle
   */
  private getEventRouting(event: BaseEvent): {
    exchange: string
    routingKey: string
  } {
    switch (event.eventType) {
      case 'order.created':
        return {
          exchange: 'order-events',
          routingKey: 'order.created',
        }
      default:
        throw new Error(`Unknown event type: ${event.eventType}`)
    }
  }
}
