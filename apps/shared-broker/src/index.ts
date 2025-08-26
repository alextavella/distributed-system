// Main broker client
export {
  BrokerClient,
  getBrokerClient,
  initializeBrokerClient,
  shutdownBrokerClient,
} from './broker-client.js'

// Configuration
export { defaultBrokerConfig } from './config/broker.config.js'
export type {
  BrokerConfig,
  ExchangeConfig,
  QueueConfig,
} from './config/broker.config.js'

// Interfaces
export type {
  ConsumeOptions,
  EventHandler,
  EventMetadata,
  IEventConsumer,
  IEventPublisher,
  IMessageBrokerConnection,
  PublishOptions,
} from './interfaces/message-broker.interface.js'

export type {
  BaseEvent,
  IEventDispatcher,
  IEventFactory,
  OrderCreatedEvent,
} from './interfaces/events.interface.js'

// Implementations (if needed for testing or custom configurations)
export { EventDispatcher } from './events/event-dispatcher.js'
export { EventFactory } from './events/event-factory.js'
export { RabbitMQConnection } from './implementations/rabbitmq-connection.js'
export { RabbitMQEventConsumer } from './implementations/rabbitmq-event-consumer.js'
export { RabbitMQEventPublisher } from './implementations/rabbitmq-event-publisher.js'
