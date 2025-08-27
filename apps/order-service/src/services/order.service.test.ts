import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MessageBroker } from '../interfaces/message-broker.interface.js'
import type { OrderRepository } from '../interfaces/order-repository.interface.js'
import type { CreateOrderData, Order } from '../types/order.js'
import { OrderService } from './order.service.js'

// Create mock implementations
const mockOrderRepository = {
  createOrder: vi.fn(),
  getOrderById: vi.fn(),
  getOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  getOrderStats: vi.fn(),
} as OrderRepository

const mockMessageBroker = {
  publishOrderCreated: vi.fn(),
} as MessageBroker

describe('OrderService', () => {
  let orderService: OrderService

  beforeEach(() => {
    orderService = new OrderService(mockOrderRepository, mockMessageBroker)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const orderData: CreateOrderData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'premium',
        amount: 29.99,
        currency: 'USD',
        items: [
          {
            orderId: 'generated-uuid',
            itemType: 'subscription',
            itemId: 'sub-premium',
            itemName: 'Premium Subscription',
            quantity: 1,
            unitPrice: 29.99,
            totalPrice: 29.99,
          },
        ],
      }

      const mockOrder: Order = {
        id: 'generated-uuid',
        userId: orderData.userId,
        subscriptionPlan: orderData.subscriptionPlan,
        amount: orderData.amount,
        currency: orderData.currency,
        status: 'pending',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'item-1',
            orderId: 'generated-uuid',
            itemType: 'subscription',
            itemId: 'sub-premium',
            itemName: 'Premium Subscription',
            quantity: 1,
            unitPrice: 29.99,
            totalPrice: 29.99,
            createdAt: new Date(),
          },
        ],
      }

      vi.mocked(mockOrderRepository.createOrder).mockResolvedValue(mockOrder)
      vi.mocked(mockMessageBroker.publishOrderCreated).mockResolvedValue(
        undefined,
      )

      const result = await orderService.createOrder(orderData)

      expect(result).toBeDefined()
      expect(result.id).toBe('generated-uuid')
      expect(result.userId).toBe(orderData.userId)
      expect(result.subscriptionPlan).toBe(orderData.subscriptionPlan)
      expect(result.amount).toBe(orderData.amount)
      expect(result.currency).toBe(orderData.currency)
      expect(result.status).toBe('pending')

      expect(mockOrderRepository.createOrder).toHaveBeenCalledWith(orderData)
      expect(mockMessageBroker.publishOrderCreated).toHaveBeenCalledWith({
        id: mockOrder.id,
        userId: mockOrder.userId,
        amount: mockOrder.amount,
        currency: mockOrder.currency,
        subscriptionPlan: mockOrder.subscriptionPlan,
        status: mockOrder.status,
      })
    })

    it('should create an order without items', async () => {
      const orderData: CreateOrderData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'basic',
        amount: 9.99,
        currency: 'USD',
      }

      const mockOrder: Order = {
        id: 'generated-uuid',
        userId: orderData.userId,
        subscriptionPlan: orderData.subscriptionPlan,
        amount: orderData.amount,
        currency: orderData.currency,
        status: 'pending',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      }

      vi.mocked(mockOrderRepository.createOrder).mockResolvedValue(mockOrder)
      vi.mocked(mockMessageBroker.publishOrderCreated).mockResolvedValue(
        undefined,
      )

      const result = await orderService.createOrder(orderData)

      expect(result).toBeDefined()
      expect(result.id).toBe('generated-uuid')
      expect(result.userId).toBe(orderData.userId)
      expect(result.subscriptionPlan).toBe(orderData.subscriptionPlan)
      expect(result.amount).toBe(orderData.amount)
      expect(result.currency).toBe(orderData.currency)
      expect(result.status).toBe('pending')
      expect(result.items).toHaveLength(0)
    })

    it('should handle message broker errors gracefully', async () => {
      const orderData: CreateOrderData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'basic',
        amount: 9.99,
        currency: 'USD',
      }

      const mockOrder: Order = {
        id: 'generated-uuid',
        userId: orderData.userId,
        subscriptionPlan: orderData.subscriptionPlan,
        amount: orderData.amount,
        currency: orderData.currency,
        status: 'pending',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      }

      vi.mocked(mockOrderRepository.createOrder).mockResolvedValue(mockOrder)
      vi.mocked(mockMessageBroker.publishOrderCreated).mockRejectedValue(
        new Error('Broker error'),
      )

      const result = await orderService.createOrder(orderData)

      // Order should still be created even if message broker fails
      expect(result).toBeDefined()
      expect(result.id).toBe('generated-uuid')
      expect(mockOrderRepository.createOrder).toHaveBeenCalledWith(orderData)
      expect(mockMessageBroker.publishOrderCreated).toHaveBeenCalled()
    })
  })

  describe('getOrders', () => {
    it('should get orders with pagination', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          userId: 'user-1',
          subscriptionPlan: 'premium',
          amount: 29.99,
          currency: 'USD',
          status: 'completed' as const,
          paymentMethod: 'credit_card',
          transactionId: 'tx-123',
          metadata: '{"source": "web"}',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
        },
      ]

      const mockResult = {
        orders: mockOrders,
        total: 1,
      }

      vi.mocked(mockOrderRepository.getOrders).mockResolvedValue(mockResult)

      const result = await orderService.getOrders({
        page: 1,
        limit: 10,
      })

      expect(result.orders).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)

      expect(mockOrderRepository.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      })
    })

    it('should filter orders by status', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          userId: 'user-1',
          subscriptionPlan: 'premium',
          amount: 29.99,
          currency: 'USD',
          status: 'pending' as const,
          paymentMethod: null,
          transactionId: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
        },
      ]

      const mockResult = {
        orders: mockOrders,
        total: 1,
      }

      vi.mocked(mockOrderRepository.getOrders).mockResolvedValue(mockResult)

      const result = await orderService.getOrders({
        page: 1,
        limit: 10,
        status: 'pending',
      })

      expect(result.orders).toHaveLength(1)
      expect(result.orders[0]?.status).toBe('pending')

      expect(mockOrderRepository.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: 'pending',
      })
    })
  })

  describe('getOrderById', () => {
    it('should get order by id', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        userId: 'user-1',
        subscriptionPlan: 'premium',
        amount: 29.99,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'credit_card',
        transactionId: 'tx-123',
        metadata: '{"source": "web"}',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      }

      vi.mocked(mockOrderRepository.getOrderById).mockResolvedValue(mockOrder)

      const result = await orderService.getOrderById('order-1')

      expect(result).toBeDefined()
      expect(result?.id).toBe('order-1')
      expect(result?.userId).toBe('user-1')

      expect(mockOrderRepository.getOrderById).toHaveBeenCalledWith('order-1')
    })

    it('should return null for non-existent order', async () => {
      vi.mocked(mockOrderRepository.getOrderById).mockResolvedValue(null)

      const result = await orderService.getOrderById('non-existent')

      expect(result).toBeNull()
      expect(mockOrderRepository.getOrderById).toHaveBeenCalledWith(
        'non-existent',
      )
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockUpdatedOrder: Order = {
        id: 'order-1',
        userId: 'user-1',
        subscriptionPlan: 'premium',
        amount: 29.99,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'credit_card',
        transactionId: 'tx-123',
        metadata: '{"source": "web"}',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      }

      vi.mocked(mockOrderRepository.updateOrderStatus).mockResolvedValue(
        mockUpdatedOrder,
      )

      const result = await orderService.updateOrderStatus(
        'order-1',
        'completed',
      )

      expect(result).toBeDefined()
      expect(result.status).toBe('completed')

      expect(mockOrderRepository.updateOrderStatus).toHaveBeenCalledWith(
        'order-1',
        'completed',
      )
    })
  })

  describe('getOrderStats', () => {
    it('should get order statistics', async () => {
      const mockStats = {
        totalOrders: 10,
        pendingOrders: 3,
        completedOrders: 7,
      }

      vi.mocked(mockOrderRepository.getOrderStats).mockResolvedValue(mockStats)

      const result = await orderService.getOrderStats()

      expect(result.totalOrders).toBe(10)
      expect(result.pendingOrders).toBe(3)
      expect(result.completedOrders).toBe(7)

      expect(mockOrderRepository.getOrderStats).toHaveBeenCalled()
    })
  })
})
