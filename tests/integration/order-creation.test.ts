import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { build } from '../../apps/order-service/src/index.js'
import { OrderService } from '../../apps/order-service/src/services/order.service.js'

describe('Order Creation Integration Tests', () => {
  let app: FastifyInstance
  let orderService: OrderService

  beforeAll(async () => {
    app = await build()
    orderService = new OrderService()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    // Clean up database before each test
    // This would typically be done through test database setup
  })

  describe('POST /api/orders', () => {
    describe('Valid Order Creation Scenarios', () => {
      it('should create a premium subscription order successfully', async () => {
        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440001',
          subscriptionPlan: 'premium',
          amount: '29.99',
          currency: 'USD',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(201)
        const result = JSON.parse(response.payload)

        expect(result).toMatchObject({
          userId: orderData.userId,
          subscriptionPlan: orderData.subscriptionPlan,
          amount: orderData.amount,
          currency: orderData.currency,
          status: 'pending',
        })

        expect(result.id).toBeDefined()
        expect(result.createdAt).toBeDefined()
        expect(result.updatedAt).toBeDefined()
        expect(result.paymentMethod).toBeNull()
        expect(result.transactionId).toBeNull()
      })

      it('should create an order with payment method', async () => {
        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440002',
          subscriptionPlan: 'basic',
          amount: '19.99',
          currency: 'USD',
          paymentMethod: 'credit_card',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(201)
        const result = JSON.parse(response.payload)

        expect(result.paymentMethod).toBe('credit_card')
      })

      it('should create an order with metadata', async () => {
        const metadata = {
          source: 'web',
          campaign: 'summer2024',
          referrer: 'google',
        }

        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440003',
          subscriptionPlan: 'enterprise',
          amount: '99.99',
          currency: 'EUR',
          metadata,
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(201)
        const result = JSON.parse(response.payload)

        expect(result.currency).toBe('EUR')
        // Metadata is stored as JSON string in database
        expect(result.metadata).toBe(JSON.stringify(metadata))
      })

      it('should create an order with items', async () => {
        const items = [
          {
            itemType: 'subscription',
            itemId: 'sub-premium-monthly',
            itemName: 'Premium Monthly Subscription',
            quantity: '1',
            unitPrice: '79.99',
            totalPrice: '79.99',
          },
        ]

        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440004',
          subscriptionPlan: 'premium',
          amount: '79.99',
          currency: 'USD',
          items,
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(201)
        const result = JSON.parse(response.payload)

        expect(result.amount).toBe('79.99')
        // Items are processed but not returned in the response
        // They should be stored in the database
      })

      it('should create an order with different currency (GBP)', async () => {
        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440005',
          subscriptionPlan: 'basic',
          amount: '15.99',
          currency: 'GBP',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(201)
        const result = JSON.parse(response.payload)

        expect(result.currency).toBe('GBP')
      })

      it('should create an order with large amount', async () => {
        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440006',
          subscriptionPlan: 'enterprise',
          amount: '999.99',
          currency: 'USD',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(201)
        const result = JSON.parse(response.payload)

        expect(result.amount).toBe('999.99')
        expect(result.subscriptionPlan).toBe('enterprise')
      })
    })

    describe('Invalid Order Creation Scenarios', () => {
      it('should reject order with invalid UUID', async () => {
        const orderData = {
          userId: 'invalid-uuid',
          subscriptionPlan: 'premium',
          amount: '29.99',
          currency: 'USD',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(500)
        const result = JSON.parse(response.payload)
        expect(result.error).toBe('Failed to create order')
      })

      it('should reject order with missing required fields', async () => {
        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440007',
          // Missing subscriptionPlan and amount
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(400)
      })

      it('should reject order with invalid currency', async () => {
        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440008',
          subscriptionPlan: 'premium',
          amount: '29.99',
          currency: 'INVALID',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(400)
      })

      it('should reject order with negative amount', async () => {
        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440009',
          subscriptionPlan: 'premium',
          amount: '-29.99',
          currency: 'USD',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(400)
      })

      it('should reject order with empty subscription plan', async () => {
        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440010',
          subscriptionPlan: '',
          amount: '29.99',
          currency: 'USD',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(400)
      })

      it('should reject order with zero amount', async () => {
        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440011',
          subscriptionPlan: 'premium',
          amount: '0',
          currency: 'USD',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(400)
      })
    })

    describe('Edge Cases', () => {
      it('should handle very long subscription plan names', async () => {
        const longPlanName =
          'super-premium-enterprise-business-corporate-plan-with-all-features-and-benefits-including-everything-you-can-imagine'

        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440012',
          subscriptionPlan: longPlanName,
          amount: '199.99',
          currency: 'USD',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(201)
        const result = JSON.parse(response.payload)
        expect(result.subscriptionPlan).toBe(longPlanName)
      })

      it('should handle high precision amounts', async () => {
        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440013',
          subscriptionPlan: 'premium',
          amount: '29.999999',
          currency: 'USD',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(201)
        const result = JSON.parse(response.payload)
        expect(result.amount).toBe('29.999999')
      })

      it('should handle complex metadata structures', async () => {
        const complexMetadata = {
          source: 'mobile_app',
          platform: 'ios',
          version: '2.1.0',
          device: 'iPhone 15 Pro',
          campaign: 'q4_2024_promotion',
          referrer: 'app_store',
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_campaign: 'holiday_sale',
          nested: {
            deep: {
              structure: 'test',
            },
          },
        }

        const orderData = {
          userId: '550e8400-e29b-41d4-a716-446655440014',
          subscriptionPlan: 'enterprise',
          amount: '149.99',
          currency: 'USD',
          metadata: complexMetadata,
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        expect(response.statusCode).toBe(201)
        const result = JSON.parse(response.payload)
        expect(result.metadata).toBe(JSON.stringify(complexMetadata))
      })
    })
  })

  describe('Order Retrieval', () => {
    it('should retrieve order by ID after creation', async () => {
      // First create an order
      const orderData = {
        userId: '550e8400-e29b-41d4-a716-446655440015',
        subscriptionPlan: 'premium',
        amount: '39.99',
        currency: 'USD',
      }

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: orderData,
      })

      expect(createResponse.statusCode).toBe(201)
      const createdOrder = JSON.parse(createResponse.payload)

      // Then retrieve it
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/orders/${createdOrder.id}`,
      })

      expect(getResponse.statusCode).toBe(200)
      const retrievedOrder = JSON.parse(getResponse.payload)

      expect(retrievedOrder.id).toBe(createdOrder.id)
      expect(retrievedOrder.userId).toBe(orderData.userId)
      expect(retrievedOrder.subscriptionPlan).toBe(orderData.subscriptionPlan)
      expect(retrievedOrder.amount).toBe(orderData.amount)
    })

    it('should return 404 for non-existent order', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/orders/550e8400-e29b-41d4-a716-446655440999',
      })

      expect(response.statusCode).toBe(404)
      const result = JSON.parse(response.payload)
      expect(result.error).toBe('Order not found')
    })
  })

  describe('Order Statistics', () => {
    it('should return order statistics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/orders/stats',
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)

      expect(result).toHaveProperty('totalOrders')
      expect(result).toHaveProperty('pendingOrders')
      expect(result).toHaveProperty('completedOrders')
      expect(result).toHaveProperty('totalRevenue')

      expect(typeof result.totalOrders).toBe('number')
      expect(typeof result.pendingOrders).toBe('number')
      expect(typeof result.completedOrders).toBe('number')
      expect(typeof result.totalRevenue).toBe('string')
    })
  })
})
