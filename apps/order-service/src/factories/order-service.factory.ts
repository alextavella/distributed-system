import { DrizzleOrderRepository } from '../repositories/drizzle-order.repository.js'
import { OrderService } from '../services/order.service.js'
import { RabbitMQMessageBroker } from '../services/rabbitmq-message-broker.js'

export function createOrderService(): OrderService {
  const orderRepository = new DrizzleOrderRepository()
  const messageBroker = new RabbitMQMessageBroker()

  return new OrderService(orderRepository, messageBroker)
}
