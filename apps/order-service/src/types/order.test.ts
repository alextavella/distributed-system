import { describe, expect, it } from 'vitest'
import {
  CreateOrderBodySchema,
  ErrorResponseSchema,
  OrderIdParamsSchema,
  OrderResponseSchema,
  OrderSchema,
  OrdersListResponseSchema,
  OrdersQuerySchema,
  OrderStatsResponseSchema,
  UpdateOrderStatusBodySchema,
} from './order.js'

describe('Order Schemas Validation', () => {
  describe('CreateOrderBodySchema', () => {
    it('should validate valid order data', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'premium',
        amount: 29.99,
        currency: 'USD',
        items: [
          {
            orderId: '123e4567-e89b-12d3-a456-426614174001',
            itemType: 'subscription',
            itemId: 'sub-premium',
            itemName: 'Premium Subscription',
            quantity: 1,
            unitPrice: 29.99,
            totalPrice: 29.99,
          },
        ],
      }

      const result = CreateOrderBodySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate order data with optional fields', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'basic',
        amount: 9.99,
        currency: 'EUR',
        paymentMethod: 'credit_card',
        metadata: { source: 'web' },
      }

      const result = CreateOrderBodySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate order data with items', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'premium',
        amount: 29.99,
        currency: 'USD',
        items: [
          {
            orderId: '123e4567-e89b-12d3-a456-426614174001',
            itemType: 'subscription',
            itemId: 'sub-premium',
            itemName: 'Premium Subscription',
            quantity: 1,
            unitPrice: 29.99,
            totalPrice: 29.99,
          },
        ],
      }

      const result = CreateOrderBodySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should use USD as default currency when not provided', () => {
      const dataWithoutCurrency = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'basic',
        amount: 9.99,
      }

      const result = CreateOrderBodySchema.safeParse(dataWithoutCurrency)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('USD')
      }
    })

    it('should reject invalid UUID', () => {
      const invalidData = {
        userId: 'invalid-uuid',
        subscriptionPlan: 'basic',
        amount: 9.99,
      }

      const result = CreateOrderBodySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty subscription plan', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: '',
        amount: 9.99,
      }

      const result = CreateOrderBodySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty amount', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'basic',
        amount: 0,
      }

      const result = CreateOrderBodySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid currency length', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'basic',
        amount: 9.99,
        currency: 'USDD',
      }

      const result = CreateOrderBodySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid currency length (too short)', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'basic',
        amount: 9.99,
        currency: 'US',
      }

      const result = CreateOrderBodySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        subscriptionPlan: 'basic',
        amount: 9.99,
      }

      const result = CreateOrderBodySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('OrderSchema', () => {
    it('should validate complete order object', () => {
      const completeOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'premium',
        amount: 29.99,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'credit_card',
        transactionId: 'tx-123',
        metadata: '{"source": "web"}',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        items: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            orderId: '123e4567-e89b-12d3-a456-426614174000',
            itemType: 'subscription',
            itemId: 'sub-premium',
            itemName: 'Premium Subscription',
            quantity: 1,
            unitPrice: 29.99,
            totalPrice: 29.99,
            createdAt: new Date('2024-01-01T00:00:00Z'),
          },
        ],
      }

      const result = OrderSchema.safeParse(completeOrder)
      expect(result.success).toBe(true)
    })

    it('should validate order with minimal required fields', () => {
      const minimalOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'basic',
        amount: 9.99,
        currency: 'USD',
        status: 'pending',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      }

      const result = OrderSchema.safeParse(minimalOrder)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const invalidOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'basic',
        amount: 9.99,
        currency: 'USD',
        status: 'invalid_status',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      }

      const result = OrderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
    })
  })

  describe('OrderIdParamsSchema', () => {
    it('should validate valid UUID', () => {
      const validParams = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = OrderIdParamsSchema.safeParse(validParams)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalidParams = {
        id: 'invalid-uuid',
      }

      const result = OrderIdParamsSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
    })
  })

  describe('OrdersQuerySchema', () => {
    it('should validate valid query parameters', () => {
      const validQuery = {
        page: '1',
        limit: '10',
        status: 'pending',
        userId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = OrdersQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should use default values when not provided', () => {
      const queryWithoutDefaults = {}

      const result = OrdersQuerySchema.safeParse(queryWithoutDefaults)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(10)
      }
    })

    it('should validate string numbers for page and limit', () => {
      const validQuery = {
        page: '2',
        limit: '25',
      }

      const result = OrdersQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(25)
      }
    })

    it('should reject invalid page number', () => {
      const invalidQuery = {
        page: '0',
      }

      const result = OrdersQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })

    it('should reject invalid limit number', () => {
      const invalidQuery = {
        limit: '0',
      }

      const result = OrdersQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const invalidQuery = {
        status: 'invalid_status',
      }

      const result = OrdersQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateOrderStatusBodySchema', () => {
    it('should validate valid status update', () => {
      const validUpdate = {
        status: 'completed',
      }

      const result = UpdateOrderStatusBodySchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const invalidUpdate = {
        status: 'invalid_status',
      }

      const result = UpdateOrderStatusBodySchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })

    it('should reject missing status', () => {
      const invalidUpdate = {}

      const result = UpdateOrderStatusBodySchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })
  })

  describe('Response Schemas', () => {
    it('should validate OrderResponseSchema', () => {
      const validResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        subscriptionPlan: 'premium',
        amount: 29.99,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'credit_card',
        transactionId: 'tx-123',
        metadata: '{"source": "web"}',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      }

      const result = OrderResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate OrdersListResponseSchema', () => {
      const validResponse = {
        orders: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            userId: '123e4567-e89b-12d3-a456-426614174000',
            subscriptionPlan: 'premium',
            amount: 29.99,
            currency: 'USD',
            status: 'completed',
            paymentMethod: 'credit_card',
            transactionId: 'tx-123',
            metadata: '{"source": "web"}',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-01T00:00:00Z'),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      }

      const result = OrdersListResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate OrderStatsResponseSchema', () => {
      const validResponse = {
        totalOrders: 100,
        pendingOrders: 20,
        completedOrders: 80,
        totalRevenue: '9999.99',
      }

      const result = OrderStatsResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate ErrorResponseSchema', () => {
      const validError = {
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      }

      const result = ErrorResponseSchema.safeParse(validError)
      expect(result.success).toBe(true)
    })

    it('should validate ErrorResponseSchema without code', () => {
      const validError = {
        error: 'Internal server error',
      }

      const result = ErrorResponseSchema.safeParse(validError)
      expect(result.success).toBe(true)
    })
  })
})
