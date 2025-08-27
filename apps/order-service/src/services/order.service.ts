import type { MessageBroker } from '../interfaces/message-broker.interface.js'
import type { OrderRepository } from '../interfaces/order-repository.interface.js'
import type { CreateOrderData, Order } from '../types/order.js'

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly messageBroker: MessageBroker,
  ) {}

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    // Create order using repository
    const order = await this.orderRepository.createOrder(orderData)

    // Publish event asynchronously (fire and forget)
    this.messageBroker
      .publishOrderCreated({
        id: order.id,
        userId: order.userId,
        amount: order.amount,
        currency: order.currency,
        subscriptionPlan: order.subscriptionPlan,
        status: order.status,
      })
      .catch(error => {
        // Log error but don't fail the order creation
        console.error('Failed to publish order created event:', error)
      })

    return order
  }

  async getOrders(params: {
    page: number
    limit: number
    status?: string
    userId?: string
  }) {
    const result = await this.orderRepository.getOrders(params)

    return {
      orders: result.orders,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: result.total,
      },
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.orderRepository.getOrderById(id)
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return this.orderRepository.updateOrderStatus(id, status)
  }

  async getOrderStats() {
    return this.orderRepository.getOrderStats()
  }
}
