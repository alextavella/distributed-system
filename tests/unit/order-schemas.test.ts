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
} from '../../apps/order-service/src/types/order.js'

describe('Order Schemas Validation', () => {
  describe('CreateOrderBodySchema', () => {
    it('should validate valid order data', () => {
      const validOrderData = {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'USD',
      }

      const result = CreateOrderBodySchema.safeParse(validOrderData)
      expect(result.success).toBe(true)
    })

    it('should validate order data with optional fields', () => {
      const validOrderData = {
        userId: '550e8400-e29b-41d4-a716-446655440002',
        subscriptionPlan: 'basic',
        amount: '19.99',
        currency: 'EUR',
        paymentMethod: 'credit_card',
        metadata: {
          source: 'web',
          campaign: 'summer2024',
        },
      }

      const result = CreateOrderBodySchema.safeParse(validOrderData)
      expect(result.success).toBe(true)
    })

    it('should validate order data with items', () => {
      const validOrderData = {
        userId: '550e8400-e29b-41d4-a716-446655440003',
        subscriptionPlan: 'enterprise',
        amount: '99.99',
        currency: 'USD',
        items: [
          {
            itemType: 'subscription',
            itemId: 'sub-enterprise',
            itemName: 'Enterprise Subscription',
            quantity: '1',
            unitPrice: '99.99',
            totalPrice: '99.99',
          },
        ],
      }

      const result = CreateOrderBodySchema.safeParse(validOrderData)
      expect(result.success).toBe(true)
    })

    it('should use USD as default currency when not provided', () => {
      const orderDataWithoutCurrency = {
        userId: '550e8400-e29b-41d4-a716-446655440004',
        subscriptionPlan: 'premium',
        amount: '29.99',
      }

      const result = CreateOrderBodySchema.safeParse(orderDataWithoutCurrency)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('USD')
      }
    })

    it('should reject invalid UUID', () => {
      const invalidOrderData = {
        userId: 'invalid-uuid',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'USD',
      }

      const result = CreateOrderBodySchema.safeParse(invalidOrderData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('userId')
      }
    })

    it('should reject empty subscription plan', () => {
      const invalidOrderData = {
        userId: '550e8400-e29b-41d4-a716-446655440005',
        subscriptionPlan: '',
        amount: '29.99',
        currency: 'USD',
      }

      const result = CreateOrderBodySchema.safeParse(invalidOrderData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('subscriptionPlan')
      }
    })

    it('should reject empty amount', () => {
      const invalidOrderData = {
        userId: '550e8400-e29b-41d4-a716-446655440006',
        subscriptionPlan: 'premium',
        amount: '',
        currency: 'USD',
      }

      const result = CreateOrderBodySchema.safeParse(invalidOrderData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('amount')
      }
    })

    it('should reject invalid currency length', () => {
      const invalidOrderData = {
        userId: '550e8400-e29b-41d4-a716-446655440007',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'USDD',
      }

      const result = CreateOrderBodySchema.safeParse(invalidOrderData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('currency')
      }
    })

    it('should reject invalid currency length (too short)', () => {
      const invalidOrderData = {
        userId: '550e8400-e29b-41d4-a716-446655440008',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'US',
      }

      const result = CreateOrderBodySchema.safeParse(invalidOrderData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('currency')
      }
    })

    it('should reject missing required fields', () => {
      const invalidOrderData = {
        userId: '550e8400-e29b-41d4-a716-446655440009',
        // Missing subscriptionPlan and amount
      }

      const result = CreateOrderBodySchema.safeParse(invalidOrderData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2)
        expect(
          result.error.issues.some(issue =>
            issue.path.includes('subscriptionPlan'),
          ),
        ).toBe(true)
        expect(
          result.error.issues.some(issue => issue.path.includes('amount')),
        ).toBe(true)
      }
    })
  })

  describe('OrderSchema', () => {
    it('should validate complete order object', () => {
      const validOrder = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'USD',
        status: 'pending',
        paymentMethod: 'credit_card',
        transactionId: 'txn_123',
        metadata: '{"source": "web"}',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const result = OrderSchema.safeParse(validOrder)
      expect(result.success).toBe(true)
    })

    it('should validate order with minimal required fields', () => {
      const minimalOrder = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        userId: '550e8400-e29b-41d4-a716-446655440004',
        subscriptionPlan: 'basic',
        amount: '19.99',
        currency: 'USD',
        status: 'pending',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const result = OrderSchema.safeParse(minimalOrder)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const invalidOrder = {
        id: '550e8400-e29b-41d4-a716-446655440005',
        userId: '550e8400-e29b-41d4-a716-446655440006',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'USD',
        status: 'invalid_status',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const result = OrderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status')
      }
    })
  })

  describe('OrderIdParamsSchema', () => {
    it('should validate valid UUID', () => {
      const validParams = {
        id: '550e8400-e29b-41d4-a716-446655440001',
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
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('id')
      }
    })
  })

  describe('OrdersQuerySchema', () => {
    it('should validate valid query parameters', () => {
      const validQuery = {
        page: 1,
        limit: 10,
        userId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'pending',
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
      const queryWithStringNumbers = {
        page: '2',
        limit: '20',
      }

      const result = OrdersQuerySchema.safeParse(queryWithStringNumbers)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should reject invalid page number', () => {
      const invalidQuery = {
        page: 0,
        limit: 10,
      }

      const result = OrdersQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('page')
      }
    })

    it('should reject invalid limit number', () => {
      const invalidQuery = {
        page: 1,
        limit: 101,
      }

      const result = OrdersQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('limit')
      }
    })

    it('should reject invalid status', () => {
      const invalidQuery = {
        page: 1,
        limit: 10,
        status: 'invalid_status',
      }

      const result = OrdersQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status')
      }
    })
  })

  describe('UpdateOrderStatusBodySchema', () => {
    it('should validate valid status update', () => {
      const validStatusUpdate = {
        status: 'completed',
      }

      const result = UpdateOrderStatusBodySchema.safeParse(validStatusUpdate)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const invalidStatusUpdate = {
        status: 'invalid_status',
      }

      const result = UpdateOrderStatusBodySchema.safeParse(invalidStatusUpdate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status')
      }
    })

    it('should reject missing status', () => {
      const invalidStatusUpdate = {}

      const result = UpdateOrderStatusBodySchema.safeParse(invalidStatusUpdate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status')
      }
    })
  })

  describe('Response Schemas', () => {
    it('should validate OrderResponseSchema', () => {
      const validOrderResponse = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'USD',
        status: 'pending',
        paymentMethod: null,
        transactionId: null,
        metadata: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const result = OrderResponseSchema.safeParse(validOrderResponse)
      expect(result.success).toBe(true)
    })

    it('should validate OrdersListResponseSchema', () => {
      const validOrdersList = {
        orders: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            userId: '550e8400-e29b-41d4-a716-446655440002',
            subscriptionPlan: 'premium',
            amount: '29.99',
            currency: 'USD',
            status: 'pending',
            paymentMethod: null,
            transactionId: null,
            metadata: null,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      }

      const result = OrdersListResponseSchema.safeParse(validOrdersList)
      expect(result.success).toBe(true)
    })

    it('should validate OrderStatsResponseSchema', () => {
      const validStats = {
        totalOrders: 10,
        pendingOrders: 3,
        completedOrders: 7,
        totalRevenue: '299.90',
      }

      const result = OrderStatsResponseSchema.safeParse(validStats)
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
