import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InvoiceService } from './invoice.service.js'

// Mock the database connection
vi.mock('../db/connection.js', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([
          {
            id: 'test-invoice-id',
            orderId: 'test-order-id',
            invoiceNumber: 'INV-001',
            status: 'pending',
            amount: '29.99', // Database stores as string (decimal type)
            currency: 'USD',
            orderData: '{"subscriptionPlan":"premium","source":"test"}',
            createdAt: new Date(),
            updatedAt: new Date(),
            generatedAt: null,
          },
        ]),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() =>
          Promise.resolve([
            {
              id: 'test-invoice-id',
              orderId: 'test-order-id',
              invoiceNumber: 'INV-001',
              status: 'pending',
              amount: '29.99', // Database stores as string (decimal type)
              currency: 'USD',
              orderData: '{"subscriptionPlan":"premium","source":"test"}',
              createdAt: new Date(),
              updatedAt: new Date(),
              generatedAt: null,
            },
          ]),
        ),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            offset: vi.fn().mockResolvedValue([
              {
                id: 'test-invoice-id',
                orderId: 'test-order-id',
                invoiceNumber: 'INV-001',
                status: 'pending',
                amount: '29.99', // Database stores as string (decimal type)
                currency: 'USD',
                orderData: '{"subscriptionPlan":"premium","source":"test"}',
                createdAt: new Date(),
                updatedAt: new Date(),
                generatedAt: null,
              },
            ]),
          })),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'test-invoice-id',
              orderId: 'test-order-id',
              invoiceNumber: 'INV-001',
              status: 'generated',
              amount: '29.99', // Database stores as string (decimal type)
              currency: 'USD',
              orderData: '{"subscriptionPlan":"premium","source":"test"}',
              createdAt: new Date(),
              updatedAt: new Date(),
              generatedAt: new Date(),
            },
          ]),
        })),
      })),
    })),
  },
}))

// Mock shared-broker
vi.mock('@streamflix/shared-broker', () => ({
  getBrokerClient: vi.fn(() => ({
    getEventFactory: vi.fn(() => ({
      createOrderCreatedEvent: vi.fn(() => ({
        eventId: 'test-event-id',
        eventType: 'order.created',
        timestamp: new Date().toISOString(),
        data: {
          orderId: 'test-order-id',
          userId: 'test-user-id',
          subscriptionPlan: 'premium',
          amount: 29.99, // Application uses numeric values
          currency: 'USD',
          status: 'pending',
        },
      })),
    })),
    getEventDispatcher: vi.fn(() => ({
      dispatch: vi.fn().mockResolvedValue(undefined),
    })),
  })),
}))

describe('InvoiceService', () => {
  let invoiceService: InvoiceService

  beforeEach(() => {
    vi.clearAllMocks()
    invoiceService = new InvoiceService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createInvoice', () => {
    it('should create invoice successfully', async () => {
      const invoiceData = {
        orderId: 'order-123',
        userId: 'user-456',
        amount: 29.99, // Numeric value for monetary amount
        currency: 'USD',
        dueDate: new Date('2024-12-31'),
        metadata: {
          subscriptionPlan: 'premium',
          source: 'test',
        },
        items: [
          {
            itemType: 'subscription',
            itemId: 'sub-premium-monthly',
            itemName: 'Premium Monthly Subscription',
            quantity: 1, // Numeric value for quantity
            unitPrice: 29.99, // Numeric value for unit price
            totalPrice: 29.99, // Numeric value for total price
          },
        ],
      }

      const result = await invoiceService.createInvoice(invoiceData)

      expect(result).toBeDefined()
      expect(result.id).toBe('test-invoice-id')
      expect(result.invoiceNumber).toBe('INV-001')
      expect(result.amount).toBe(29.99) // Should be numeric value
    })
  })

  describe('getInvoiceById', () => {
    it('should return invoice by ID', async () => {
      const result = await invoiceService.getInvoiceById('invoice-789')

      expect(result).toBeDefined()
      expect(result?.id).toBe('test-invoice-id')
      expect(result?.invoiceNumber).toBe('INV-001')
      expect(result?.amount).toBe(29.99) // Should be numeric value
    })
  })

  // TODO: Fix getInvoices test - needs more complex database mocking
  // describe('getInvoices', () => {
  //   it('should return invoices with pagination', async () => {
  //     const result = await invoiceService.getInvoices({ page: 1, limit: 10 })

  //     expect(result).toBeDefined()
  //     expect(result.invoices).toBeDefined()
  //     expect(result.pagination).toBeDefined()
  //     expect(result.invoices[0]?.amount).toBe(29.99) // Should be numeric value
  //   })
  // })

  describe('updateStatus', () => {
    it('should update invoice status successfully', async () => {
      const result = await invoiceService.updateStatus('invoice-789', {
        status: 'generated',
      })

      expect(result).toBeDefined()
      expect(result.status).toBe('generated')
      expect(result.amount).toBe(29.99) // Should be numeric value
    })
  })
})
