import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InvoiceEventConsumer } from './invoice-event-consumer.js'

// Mock the InvoiceService
vi.mock('./invoice.service.js', () => ({
  InvoiceService: vi.fn().mockImplementation(() => ({
    createInvoice: vi.fn().mockResolvedValue({
      id: 'test-invoice-id',
      invoiceNumber: 'INV-001',
      orderId: 'test-order-id',
      userId: 'test-user-id',
      amount: 29.99, // Numeric value for monetary amount
      currency: 'USD',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generatedAt: null,
      dueDate: new Date().toISOString(),
      metadata: {},
      items: [],
    }),
  })),
}))

// Mock the shared-broker
vi.mock('@streamflix/shared-broker', () => ({
  getBrokerClient: vi.fn(() => ({
    subscribeToOrderCreated: vi.fn().mockResolvedValue(undefined),
  })),
}))

describe('InvoiceEventConsumer', () => {
  let consumer: InvoiceEventConsumer

  beforeEach(() => {
    vi.clearAllMocks()
    consumer = new InvoiceEventConsumer()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getStatus', () => {
    it('should return correct consuming status', () => {
      expect(consumer.getStatus()).toEqual({ isConsuming: false })
    })
  })

  describe('startConsuming', () => {
    it('should start consuming events successfully', async () => {
      await consumer.startConsuming()
      expect(consumer.getStatus().isConsuming).toBe(true)
    })

    it('should not start consuming if already running', async () => {
      // Start first time
      await consumer.startConsuming()
      expect(consumer.getStatus().isConsuming).toBe(true)

      // Try to start again
      await consumer.startConsuming()
      expect(consumer.getStatus().isConsuming).toBe(true)
    })
  })

  describe('stopConsuming', () => {
    it('should stop consuming successfully', async () => {
      // Start consuming first
      await consumer.startConsuming()
      expect(consumer.getStatus().isConsuming).toBe(true)

      // Stop consuming
      await consumer.stopConsuming()
      expect(consumer.getStatus().isConsuming).toBe(false)
    })

    it('should handle stop when not consuming', async () => {
      await consumer.stopConsuming()
      expect(consumer.getStatus().isConsuming).toBe(false)
    })
  })
})
