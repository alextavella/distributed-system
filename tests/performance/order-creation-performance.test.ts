import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { build } from '../../apps/order-service/src/index.js'

describe('Order Creation Performance Tests', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await build()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Single Order Creation Performance', () => {
    it('should create a single order within acceptable latency', async () => {
      const orderData = {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'USD',
      }

      const startTime = performance.now()

      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: orderData,
      })

      const endTime = performance.now()
      const latency = endTime - startTime

      expect(response.statusCode).toBe(201)
      expect(latency).toBeLessThan(100) // Should complete within 100ms

      console.log(`Single order creation latency: ${latency.toFixed(2)}ms`)
    })

    it('should create order with metadata within acceptable latency', async () => {
      const orderData = {
        userId: '550e8400-e29b-41d4-a716-446655440002',
        subscriptionPlan: 'enterprise',
        amount: '99.99',
        currency: 'EUR',
        metadata: {
          source: 'web',
          campaign: 'q4_2024',
          referrer: 'google',
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_campaign: 'holiday_sale',
        },
      }

      const startTime = performance.now()

      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: orderData,
      })

      const endTime = performance.now()
      const latency = endTime - startTime

      expect(response.statusCode).toBe(201)
      expect(latency).toBeLessThan(150) // Slightly higher for complex metadata

      console.log(
        `Order with metadata creation latency: ${latency.toFixed(2)}ms`,
      )
    })

    it('should create order with items within acceptable latency', async () => {
      const orderData = {
        userId: '550e8400-e29b-41d4-a716-446655440003',
        subscriptionPlan: 'premium',
        amount: '79.99',
        currency: 'USD',
        items: [
          {
            itemType: 'subscription',
            itemId: 'sub-premium-monthly',
            itemName: 'Premium Monthly Subscription',
            quantity: '1',
            unitPrice: '79.99',
            totalPrice: '79.99',
          },
          {
            itemType: 'addon',
            itemId: 'addon-support',
            itemName: 'Priority Support',
            quantity: '1',
            unitPrice: '19.99',
            totalPrice: '19.99',
          },
        ],
      }

      const startTime = performance.now()

      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: orderData,
      })

      const endTime = performance.now()
      const latency = endTime - startTime

      expect(response.statusCode).toBe(201)
      expect(latency).toBeLessThan(200) // Higher for orders with items

      console.log(`Order with items creation latency: ${latency.toFixed(2)}ms`)
    })
  })

  describe('Concurrent Order Creation Performance', () => {
    it('should handle 10 concurrent order creations', async () => {
      const concurrentCount = 10
      const orderPromises = []

      for (let i = 0; i < concurrentCount; i++) {
        const orderData = {
          userId: `550e8400-e29b-41d4-a716-4466554400${(i + 10).toString().padStart(2, '0')}`,
          subscriptionPlan: 'premium',
          amount: '29.99',
          currency: 'USD',
        }

        orderPromises.push(
          app.inject({
            method: 'POST',
            url: '/api/orders',
            payload: orderData,
          }),
        )
      }

      const startTime = performance.now()
      const responses = await Promise.all(orderPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime
      const averageLatency = totalTime / concurrentCount

      // Verify all orders were created successfully
      responses.forEach(response => {
        expect(response.statusCode).toBe(201)
      })

      expect(averageLatency).toBeLessThan(200) // Average should be under 200ms

      console.log(
        `10 concurrent orders - Total time: ${totalTime.toFixed(2)}ms, Average: ${averageLatency.toFixed(2)}ms`,
      )
    })

    it('should handle 50 concurrent order creations', async () => {
      const concurrentCount = 50
      const orderPromises = []

      for (let i = 0; i < concurrentCount; i++) {
        const orderData = {
          userId: `550e8400-e29b-41d4-a716-4466554401${(i + 10).toString().padStart(2, '0')}`,
          subscriptionPlan: 'basic',
          amount: '19.99',
          currency: 'USD',
        }

        orderPromises.push(
          app.inject({
            method: 'POST',
            url: '/api/orders',
            payload: orderData,
          }),
        )
      }

      const startTime = performance.now()
      const responses = await Promise.all(orderPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime
      const averageLatency = totalTime / concurrentCount

      // Verify all orders were created successfully
      responses.forEach(response => {
        expect(response.statusCode).toBe(201)
      })

      expect(averageLatency).toBeLessThan(500) // Average should be under 500ms for higher load

      console.log(
        `50 concurrent orders - Total time: ${totalTime.toFixed(2)}ms, Average: ${averageLatency.toFixed(2)}ms`,
      )
    })
  })

  describe('Sequential Order Creation Performance', () => {
    it('should create 100 orders sequentially within reasonable time', async () => {
      const sequentialCount = 100
      const startTime = performance.now()
      const responses = []

      for (let i = 0; i < sequentialCount; i++) {
        const orderData = {
          userId: `550e8400-e29b-41d4-a716-4466554402${(i + 10).toString().padStart(2, '0')}`,
          subscriptionPlan: 'enterprise',
          amount: '99.99',
          currency: 'USD',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/api/orders',
          payload: orderData,
        })

        responses.push(response)
        expect(response.statusCode).toBe(201)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime
      const averageLatency = totalTime / sequentialCount

      expect(totalTime).toBeLessThan(10000) // Should complete within 10 seconds
      expect(averageLatency).toBeLessThan(100) // Average should be under 100ms

      console.log(
        `100 sequential orders - Total time: ${totalTime.toFixed(2)}ms, Average: ${averageLatency.toFixed(2)}ms`,
      )
    })
  })

  describe('Throughput Performance', () => {
    it('should achieve minimum throughput of 100 orders per second', async () => {
      const orderCount = 100
      const startTime = performance.now()
      const orderPromises = []

      for (let i = 0; i < orderCount; i++) {
        const orderData = {
          userId: `550e8400-e29b-41d4-a716-4466554403${(i + 10).toString().padStart(2, '0')}`,
          subscriptionPlan: 'premium',
          amount: '29.99',
          currency: 'USD',
        }

        orderPromises.push(
          app.inject({
            method: 'POST',
            url: '/api/orders',
            payload: orderData,
          }),
        )
      }

      const responses = await Promise.all(orderPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime
      const throughput = (orderCount / totalTime) * 1000 // orders per second

      // Verify all orders were created successfully
      responses.forEach(response => {
        expect(response.statusCode).toBe(201)
      })

      expect(throughput).toBeGreaterThan(100) // Should achieve at least 100 orders/second

      console.log(
        `Throughput test - ${orderCount} orders in ${totalTime.toFixed(2)}ms = ${throughput.toFixed(2)} orders/second`,
      )
    })
  })

  describe('Memory and Resource Usage', () => {
    it('should not have memory leaks during high-volume order creation', async () => {
      const orderCount = 200
      const orderPromises = []

      // Get initial memory usage (if available)
      const initialMemory =
        (global as any).performance?.memory?.usedJSHeapSize || 0

      for (let i = 0; i < orderCount; i++) {
        const orderData = {
          userId: `550e8400-e29b-41d4-a716-4466554404${(i + 10).toString().padStart(2, '0')}`,
          subscriptionPlan: 'basic',
          amount: '19.99',
          currency: 'USD',
        }

        orderPromises.push(
          app.inject({
            method: 'POST',
            url: '/api/orders',
            payload: orderData,
          }),
        )
      }

      const responses = await Promise.all(orderPromises)
      const finalMemory =
        (global as any).performance?.memory?.usedJSHeapSize || 0

      // Verify all orders were created successfully
      responses.forEach(response => {
        expect(response.statusCode).toBe(201)
      })

      // If memory tracking is available, check for reasonable memory usage
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024)

        expect(memoryIncreaseMB).toBeLessThan(100) // Should not increase by more than 100MB

        console.log(
          `Memory usage - Initial: ${(initialMemory / (1024 * 1024)).toFixed(2)}MB, Final: ${(finalMemory / (1024 * 1024)).toFixed(2)}MB, Increase: ${memoryIncreaseMB.toFixed(2)}MB`,
        )
      }
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle invalid requests efficiently', async () => {
      const invalidOrderData = {
        userId: 'invalid-uuid',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'USD',
      }

      const startTime = performance.now()

      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: invalidOrderData,
      })

      const endTime = performance.now()
      const latency = endTime - startTime

      expect(response.statusCode).toBe(500)
      expect(latency).toBeLessThan(50) // Error handling should be fast

      console.log(`Invalid request handling latency: ${latency.toFixed(2)}ms`)
    })

    it('should handle malformed JSON efficiently', async () => {
      const startTime = performance.now()

      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: 'invalid json string',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const endTime = performance.now()
      const latency = endTime - startTime

      expect(response.statusCode).toBe(400)
      expect(latency).toBeLessThan(20) // JSON parsing errors should be very fast

      console.log(`Malformed JSON handling latency: ${latency.toFixed(2)}ms`)
    })
  })

  describe('Database Performance', () => {
    it('should handle database operations efficiently', async () => {
      const orderData = {
        userId: '550e8400-e29b-41d4-a716-446655440999',
        subscriptionPlan: 'premium',
        amount: '29.99',
        currency: 'USD',
      }

      // Create order
      const createStartTime = performance.now()
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: orderData,
      })
      const createEndTime = performance.now()
      const createLatency = createEndTime - createStartTime

      expect(createResponse.statusCode).toBe(201)
      const createdOrder = JSON.parse(createResponse.payload)

      // Retrieve order
      const retrieveStartTime = performance.now()
      const retrieveResponse = await app.inject({
        method: 'GET',
        url: `/api/orders/${createdOrder.id}`,
      })
      const retrieveEndTime = performance.now()
      const retrieveLatency = retrieveEndTime - retrieveStartTime

      expect(retrieveResponse.statusCode).toBe(200)

      // Update order status
      const updateStartTime = performance.now()
      const updateResponse = await app.inject({
        method: 'PATCH',
        url: `/api/orders/${createdOrder.id}/status`,
        payload: { status: 'completed' },
      })
      const updateEndTime = performance.now()
      const updateLatency = updateEndTime - updateStartTime

      expect(updateResponse.statusCode).toBe(200)

      console.log(`Database operations performance:`)
      console.log(`  - Create: ${createLatency.toFixed(2)}ms`)
      console.log(`  - Retrieve: ${retrieveLatency.toFixed(2)}ms`)
      console.log(`  - Update: ${updateLatency.toFixed(2)}ms`)

      // All operations should be reasonably fast
      expect(createLatency).toBeLessThan(100)
      expect(retrieveLatency).toBeLessThan(50)
      expect(updateLatency).toBeLessThan(100)
    })
  })
})
