export interface MessageBroker {
  publishOrderCreated(orderData: {
    id: string
    userId: string
    amount: number
    currency: string
    subscriptionPlan: string
    status: string
  }): Promise<void>
}
