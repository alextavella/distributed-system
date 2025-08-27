import { describe, it, expect } from 'vitest'
import { z } from 'zod'

describe('Schema Validation - Local Tests', () => {
  describe('Basic Zod Validation', () => {
    it('should validate simple schemas', () => {
      const UserSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        age: z.number().min(0).optional()
      })

      const validUser = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      }

      const invalidUser = {
        id: '123',
        name: 'John Doe',
        email: 'invalid-email',
        age: -5
      }

      expect(UserSchema.safeParse(validUser).success).toBe(true)
      expect(UserSchema.safeParse(invalidUser).success).toBe(false)
    })

    it('should handle UUID validation', () => {
      const UUIDSchema = z.string().uuid()
      
      const validUUID = '550e8400-e29b-41d4-a716-446655440001'
      const invalidUUID = 'invalid-uuid'

      expect(UUIDSchema.safeParse(validUUID).success).toBe(true)
      expect(UUIDSchema.safeParse(invalidUUID).success).toBe(false)
    })

    it('should handle enum validation', () => {
      const StatusSchema = z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded'])
      
      const validStatus = 'pending'
      const invalidStatus = 'invalid'

      expect(StatusSchema.safeParse(validStatus).success).toBe(true)
      expect(StatusSchema.safeParse(invalidStatus).success).toBe(false)
    })

    it('should handle date validation', () => {
      const DateSchema = z.date()
      
      const validDate = new Date()
      const invalidDate = '2024-01-01'

      expect(DateSchema.safeParse(validDate).success).toBe(true)
      expect(DateSchema.safeParse(invalidDate).success).toBe(false)
    })
  })

  describe('Order-like Schema Validation', () => {
    it('should validate order creation data', () => {
      const CreateOrderSchema = z.object({
        userId: z.string().uuid(),
        subscriptionPlan: z.string().min(1),
        amount: z.string().min(1),
        currency: z.string().length(3).default('USD'),
        paymentMethod: z.string().nullable().optional(),
        metadata: z.record(z.string(), z.unknown()).nullable().optional()
      })

      const validOrder = {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'USD'
      }

      const orderWithOptionals = {
        userId: '550e8400-e29b-41d4-a716-446655440002',
        subscriptionPlan: 'basic',
        amount: '19.99',
        currency: 'EUR',
        paymentMethod: 'credit_card',
        metadata: { source: 'web' }
      }

      expect(CreateOrderSchema.safeParse(validOrder).success).toBe(true)
      expect(CreateOrderSchema.safeParse(orderWithOptionals).success).toBe(true)
    })

    it('should reject invalid order data', () => {
      const CreateOrderSchema = z.object({
        userId: z.string().uuid(),
        subscriptionPlan: z.string().min(1),
        amount: z.string().min(1),
        currency: z.string().length(3).default('USD')
      })

      const invalidOrders = [
        {
          userId: 'invalid-uuid',
          subscriptionPlan: 'premium',
          amount: '29.99',
          currency: 'USD'
        },
        {
          userId: '550e8400-e29b-41d4-a716-446655440001',
          subscriptionPlan: '',
          amount: '29.99',
          currency: 'USD'
        },
        {
          userId: '550e8400-e29b-41d4-a716-446655440001',
          subscriptionPlan: 'premium',
          amount: '',
          currency: 'USD'
        },
        {
          userId: '550e8400-e29b-41d4-a716-446655440001',
          subscriptionPlan: 'premium',
          amount: '29.99',
          currency: 'US'
        }
      ]

      invalidOrders.forEach((invalidOrder, index) => {
        const result = CreateOrderSchema.safeParse(invalidOrder)
        expect(result.success).toBe(false)
        if (!result.success) {
          console.log(`Invalid order ${index + 1} errors:`, result.error.issues)
        }
      })
    })
  })

  describe('Response Schema Validation', () => {
    it('should validate order response data', () => {
      const OrderResponseSchema = z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
        subscriptionPlan: z.string(),
        amount: z.string(),
        currency: z.string(),
        status: z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded']),
        paymentMethod: z.string().nullable(),
        transactionId: z.string().nullable(),
        metadata: z.string().nullable(),
        createdAt: z.date(),
        updatedAt: z.date()
      })

      const validResponse = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
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

      const result = OrderResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate pagination data', () => {
      const PaginationSchema = z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number()
      })

      const validPagination = {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3
      }

      expect(PaginationSchema.safeParse(validPagination).success).toBe(true)
    })
  })

  describe('Query Parameter Validation', () => {
    it('should validate query parameters with defaults', () => {
      const QuerySchema = z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
        userId: z.string().uuid().optional(),
        status: z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded']).optional()
      })

      // Test with no parameters (should use defaults)
      const emptyQuery = {}
      const result1 = QuerySchema.safeParse(emptyQuery)
      expect(result1.success).toBe(true)
      if (result1.success) {
        expect(result1.data.page).toBe(1)
        expect(result1.data.limit).toBe(10)
      }

      // Test with string numbers (should be coerced)
      const stringQuery = {
        page: '2',
        limit: '20'
      }
      const result2 = QuerySchema.safeParse(stringQuery)
      expect(result2.success).toBe(true)
      if (result2.success) {
        expect(result2.data.page).toBe(2)
        expect(result2.data.limit).toBe(20)
      }

      // Test with all parameters
      const fullQuery = {
        page: 3,
        limit: 15,
        userId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'pending'
      }
      const result3 = QuerySchema.safeParse(fullQuery)
      expect(result3.success).toBe(true)
    })
  })
})
