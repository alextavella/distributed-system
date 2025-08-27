export interface MessageBroker {
  subscribeToOrderEvents(): Promise<void>
  unsubscribeFromOrderEvents(): Promise<void>
}
