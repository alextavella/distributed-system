import { getBrokerClient } from '@streamflix/shared-broker'
import type { MessageBroker } from '../interfaces/message-broker.interface.js'

export class RabbitMQMessageBroker implements MessageBroker {
  async publishOrderCreated(orderData: {
    id: string
    userId: string
    amount: number
    currency: string
    subscriptionPlan: string
    status: string
  }): Promise<void> {
    const brokerClient = getBrokerClient()
    await brokerClient.publishOrderCreated({
      orderId: orderData.id,
      userId: orderData.userId,
      amount: orderData.amount,
      currency: orderData.currency,
      subscriptionPlan: orderData.subscriptionPlan,
      status: orderData.status,
    })
  }
}
