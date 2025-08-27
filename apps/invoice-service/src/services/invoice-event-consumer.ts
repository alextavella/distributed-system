import type {
  EventHandler,
  EventMetadata,
  OrderCreatedEvent,
} from '@streamflix/shared-broker'
import { getBrokerClient } from '@streamflix/shared-broker'

export class InvoiceEventConsumer {
  private isConsuming = false

  /**
   * Start consuming real RabbitMQ events
   */
  async startConsuming(): Promise<void> {
    if (this.isConsuming) {
      console.log('⚠️ Event consumer is already running')
      return
    }

    try {
      console.log('🎧 Starting invoice event consumer...')

      const brokerClient = getBrokerClient()

      // Create event handler
      const orderCreatedHandler: EventHandler<OrderCreatedEvent> = async (
        event: OrderCreatedEvent,
        metadata: EventMetadata,
      ) => {
        await this.handleOrderCreated(event, metadata)
      }

      // Subscribe to order.created events
      await brokerClient.subscribeToOrderCreated(orderCreatedHandler, {
        autoAck: false, // Manual acknowledgment for reliability
        durable: true, // Persistent queue
        prefetch: 1, // Process one message at a time
      })

      this.isConsuming = true
      console.log('✅ Invoice event consumer started successfully')
      console.log('📋 Listening for order.created events from RabbitMQ')
    } catch (error) {
      console.error('❌ Failed to start invoice event consumer:', error)
      this.isConsuming = false
      throw error
    }
  }

  /**
   * Stop consumer
   */
  async stopConsuming(): Promise<void> {
    if (!this.isConsuming) {
      console.log('⚠️ Event consumer is not running')
      return
    }

    try {
      console.log('🛑 Stopping invoice event consumer...')
      this.isConsuming = false
      console.log('✅ Invoice event consumer stopped successfully')
    } catch (error) {
      console.error('❌ Failed to stop invoice event consumer:', error)
      throw error
    }
  }

  /**
   * Handle incoming order created events
   */
  private async handleOrderCreated(
    event: OrderCreatedEvent,
    metadata: EventMetadata,
  ): Promise<void> {
    const startTime = Date.now()

    try {
      console.log(`📨 Received order.created event: ${event.eventId}`)
      console.log(`📋 Order ID: ${event.data.orderId}`)
      console.log(`💰 Amount: ${event.data.amount} ${event.data.currency}`)
      console.log(`🔗 Routing Key: ${metadata.routingKey}`)

      // For now, just log the event
      // TODO: Implement invoice generation logic
      console.log('📝 Invoice generation logic to be implemented')

      const processingTime = Date.now() - startTime
      console.log(
        `✅ Successfully processed order.created event in ${processingTime}ms`,
      )

      this.logEventProcessing({
        eventId: event.eventId,
        eventType: event.eventType,
        orderId: event.data.orderId,
        processingTime,
        status: 'success',
      })
    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error(
        `❌ Failed to process order.created event: ${event.eventId}`,
        error,
      )

      this.logEventProcessing({
        eventId: event.eventId,
        eventType: event.eventType,
        orderId: event.data.orderId,
        processingTime,
        status: 'failed',
        error: (error as Error).message,
      })
      throw error
    }
  }

  /**
   * Log event processing for monitoring
   */
  private logEventProcessing(logEntry: {
    eventId: string
    eventType: string
    orderId: string
    processingTime: number
    status: 'success' | 'failed'
    error?: string
  }): void {
    console.log(JSON.stringify(logEntry))
  }

  /**
   * Get consumer status
   */
  getStatus(): { isConsuming: boolean } {
    return { isConsuming: this.isConsuming }
  }
}

// Export singleton
export const invoiceEventConsumer = new InvoiceEventConsumer()
