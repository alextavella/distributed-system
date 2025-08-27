import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OrderService } from '../../apps/order-service/src/services/order.service.js'
import type { CreateOrderData } from '../../apps/order-service/src/types/order.js'

// Mock the shared broker
vi.mock('@streamflix/shared-broker', () => ({
  getBrokerClient: vi.fn(() => ({
    publishOrderCreated: vi.fn().mockResolvedValue(undefined)
  }))
}))

// Mock database operations
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
}

// Mock the database connection
vi.mock('../../apps/order-service/src/db/connection', () => ({
  getDb: vi.fn(() => mockDb)
}))

describe('OrderService', () => {
  let orderService: OrderService

  beforeEach(() => {
    orderService = new OrderService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createOrder', () => {
    const validOrderData: CreateOrderData = {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      subscriptionPlan: 'premium',
      amount: '29.99',
      currency: 'USD'
    }

    it('should create an order successfully', async () => {
      const mockOrder = {
        id: 'generated-uuid',
        userId: validOrderData.userId,
        subscriptionPlan: validOrderData.subscriptionPlan,
        amount: validOrderData.amount,
        currency: validOrderData.currency,
        status: 'pending',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Mock the database insert operation
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockOrder])
        })
      })

      // Mock crypto.randomUUID
      const mockUUID = 'test-uuid-123'
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => mockUUID)
      })

      const result = await orderService.createOrder(validOrderData)

      expect(result).toEqual(mockOrder)
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should create an order with payment method', async () => {
      const orderDataWithPayment: CreateOrderData = {
        ...validOrderData,
        paymentMethod: 'credit_card'
      }

      const mockOrder = {
        id: 'generated-uuid',
        userId: orderDataWithPayment.userId,
        subscriptionPlan: orderDataWithPayment.subscriptionPlan,
        amount: orderDataWithPayment.amount,
        currency: orderDataWithPayment.currency,
        status: 'pending',
        paymentMethod: 'credit_card',
        transactionId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockOrder])
        })
      })

      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => 'test-uuid-123')
      })

      const result = await orderService.createOrder(orderDataWithPayment)

      expect(result.paymentMethod).toBe('credit_card')
    })

    it('should create an order with metadata', async () => {
      const metadata = {
        source: 'web',
        campaign: 'summer2024'
      }

      const orderDataWithMetadata: CreateOrderData = {
        ...validOrderData,
        metadata
      }

      const mockOrder = {
        id: 'generated-uuid',
        userId: orderDataWithMetadata.userId,
        subscriptionPlan: orderDataWithMetadata.subscriptionPlan,
        amount: orderDataWithMetadata.amount,
        currency: orderDataWithMetadata.currency,
        status: 'pending',
        paymentMethod: null,
        transactionId: null,
        metadata: JSON.stringify(metadata),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockOrder])
        })
      })

      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => 'test-uuid-123')
      })

      const result = await orderService.createOrder(orderDataWithMetadata)

      expect(result.metadata).toBe(JSON.stringify(metadata))
    })

    it('should create an order with items', async () => {
      const items = [
        {
          itemType: 'subscription',
          itemId: 'sub-premium',
          itemName: 'Premium Subscription',
          quantity: '1',
          unitPrice: '29.99',
          totalPrice: '29.99'
        }
      ]

      const orderDataWithItems: CreateOrderData = {
        ...validOrderData,
        items
      }

      const mockOrder = {
        id: 'generated-uuid',
        userId: orderDataWithItems.userId,
        subscriptionPlan: orderDataWithItems.subscriptionPlan,
        amount: orderDataWithItems.amount,
        currency: orderDataWithItems.currency,
        status: 'pending',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Mock order creation
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockOrder])
        })
      })

      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => 'test-uuid-123')
      })

      const result = await orderService.createOrder(orderDataWithItems)

      expect(result).toEqual(mockOrder)
      // Verify that items were also inserted
      expect(mockDb.insert).toHaveBeenCalledTimes(2) // Once for order, once for items
    })

    it('should handle null metadata gracefully', async () => {
      const orderDataWithNullMetadata: CreateOrderData = {
        ...validOrderData,
        metadata: null
      }

      const mockOrder = {
        id: 'generated-uuid',
        userId: orderDataWithNullMetadata.userId,
        subscriptionPlan: orderDataWithNullMetadata.subscriptionPlan,
        amount: orderDataWithNullMetadata.amount,
        currency: orderDataWithNullMetadata.currency,
        status: 'pending',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockOrder])
        })
      })

      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => 'test-uuid-123')
      })

      const result = await orderService.createOrder(orderDataWithNullMetadata)

      expect(result.metadata).toBeNull()
    })

    it('should handle undefined payment method', async () => {
      const orderDataWithoutPayment: CreateOrderData = {
        ...validOrderData,
        paymentMethod: undefined
      }

      const mockOrder = {
        id: 'generated-uuid',
        userId: orderDataWithoutPayment.userId,
        subscriptionPlan: orderDataWithoutPayment.subscriptionPlan,
        amount: orderDataWithoutPayment.amount,
        currency: orderDataWithoutPayment.currency,
        status: 'pending',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockOrder])
        })
      })

      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => 'test-uuid-123')
      })

      const result = await orderService.createOrder(orderDataWithoutPayment)

      expect(result.paymentMethod).toBeNull()
    })
  })

  describe('getOrderById', () => {
    it('should return order when found', async () => {
      const mockOrder = {
        id: 'test-uuid',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'USD',
        status: 'pending',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockOrder])
        })
      })

      const result = await orderService.getOrderById('test-uuid')

      expect(result).toEqual(mockOrder)
    })

    it('should return null when order not found', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      })

      const result = await orderService.getOrderById('non-existent-uuid')

      expect(result).toBeNull()
    })
  })

  describe('getOrders', () => {
    it('should return orders with pagination', async () => {
      const mockOrders = [
        {
          id: 'uuid-1',
          userId: '550e8400-e29b-41d4-a716-446655440001',
          subscriptionPlan: 'premium',
          amount: '29.99',
          currency: 'USD',
          status: 'pending',
          paymentMethod: null,
          transactionId: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      const mockCountResult = [{ count: 1 }]

      // Mock count query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockCountResult)
        })
      })

      // Mock orders query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockOrders)
              })
            })
          })
        })
      })

      const result = await orderService.getOrders({ page: 1, limit: 10 })

      expect(result.orders).toEqual(mockOrders)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      })
    })

    it('should filter orders by userId', async () => {
      const mockCountResult = [{ count: 1 }]
      const mockOrders = [
        {
          id: 'uuid-1',
          userId: '550e8400-e29b-41d4-a716-446655440001',
          subscriptionPlan: 'premium',
          amount: '29.99',
          currency: 'USD',
          status: 'pending',
          paymentMethod: null,
          transactionId: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockCountResult)
        })
      })

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockOrders)
              })
            })
          })
        })
      })

      const result = await orderService.getOrders({
        page: 1,
        limit: 10,
        userId: '550e8400-e29b-41d4-a716-446655440001'
      })

      expect(result.orders).toEqual(mockOrders)
      expect(result.pagination.total).toBe(1)
    })

    it('should filter orders by status', async () => {
      const mockCountResult = [{ count: 2 }]
      const mockOrders = [
        {
          id: 'uuid-1',
          userId: '550e8400-e29b-41d4-a716-446655440001',
          subscriptionPlan: 'premium',
          amount: '29.99',
          currency: 'USD',
          status: 'pending',
          paymentMethod: null,
          transactionId: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockCountResult)
        })
      })

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockOrders)
              })
            })
          })
        })
      })

      const result = await orderService.getOrders({
        page: 1,
        limit: 10,
        status: 'pending'
      })

      expect(result.orders).toEqual(mockOrders)
      expect(result.pagination.total).toBe(2)
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockUpdatedOrder = {
        id: 'test-uuid',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'USD',
        status: 'completed',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedOrder])
          })
        })
      })

      const result = await orderService.updateOrderStatus('test-uuid', {
        status: 'completed'
      })

      expect(result.status).toBe('completed')
      expect(result.updatedAt).toBeDefined()
    })

    it('should throw error when order not found', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([])
          })
        })
      })

      await expect(
        orderService.updateOrderStatus('non-existent-uuid', {
          status: 'completed'
        })
      ).rejects.toThrow('Order not found')
    })
  })

  describe('getOrderStats', () => {
    it('should return order statistics', async () => {
      const mockStats = [
        {
          totalOrders: 10,
          pendingOrders: 3,
          completedOrders: 7,
          totalRevenue: '299.90'
        }
      ]

      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue(mockStats)
      })

      const result = await orderService.getOrderStats()

      expect(result).toEqual({
        totalOrders: 10,
        pendingOrders: 3,
        completedOrders: 7,
        totalRevenue: '299.90'
      })
    })

    it('should handle empty database', async () => {
      const mockStats = [
        {
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalRevenue: '0'
        }
      ]

      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue(mockStats)
      })

      const result = await orderService.getOrderStats()

      expect(result).toEqual({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: '0'
      })
    })
  })
})
