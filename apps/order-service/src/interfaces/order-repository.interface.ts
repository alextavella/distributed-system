import type { CreateOrderData, Order, OrderItem } from '../types/order.js'

export interface OrderRepository {
  createOrder(orderData: CreateOrderData): Promise<Order>
  getOrderById(id: string): Promise<Order | null>
  getOrders(params: {
    page: number
    limit: number
    status?: string
    userId?: string
  }): Promise<{ orders: Order[]; total: number }>
  updateOrderStatus(id: string, status: string): Promise<Order>
  getOrderStats(): Promise<{
    totalOrders: number
    pendingOrders: number
    completedOrders: number
  }>
}

export interface OrderItemRepository {
  createOrderItems(
    items: Omit<OrderItem, 'id' | 'createdAt'>[],
  ): Promise<OrderItem[]>
  getOrderItems(orderId: string): Promise<OrderItem[]>
}
