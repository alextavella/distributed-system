import type { FastifyInstance } from 'fastify'
import { invoiceEventConsumer } from '../services/invoice-event-consumer.js'
import { InvoiceService } from '../services/invoice.service.js'

export async function invoiceRoutes(fastify: FastifyInstance) {
  const invoiceService = new InvoiceService()

  // List all invoices (simplified)
  fastify.get('/invoices', async (request, reply) => {
    try {
      const invoices = await invoiceService.getInvoices()
      return reply.code(200).send({
        success: true,
        data: invoices,
      })
    } catch (error) {
      console.error('Error fetching invoices:', error)
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      })
    }
  })

  // Get invoice by ID
  fastify.get('/invoices/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const invoice = await invoiceService.getInvoiceById(id)

      if (!invoice) {
        return reply.code(404).send({
          success: false,
          error: 'Invoice not found',
        })
      }

      return reply.code(200).send({
        success: true,
        data: invoice,
      })
    } catch (error) {
      console.error('Error fetching invoice:', error)
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      })
    }
  })

  // Get invoice by order ID
  fastify.get('/invoices/order/:orderId', async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string }
      const invoice = await invoiceService.findByOrderId(orderId)

      if (!invoice) {
        return reply.code(404).send({
          success: false,
          error: 'Invoice not found',
        })
      }

      return reply.code(200).send({
        success: true,
        data: invoice,
      })
    } catch (error) {
      console.error('Error fetching invoice:', error)
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      })
    }
  })

  // Get invoice statistics (simplified)
  fastify.get('/invoices/stats', async (request, reply) => {
    try {
      const stats = await invoiceService.getInvoiceStats()
      return reply.code(200).send({
        success: true,
        data: stats,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      })
    }
  })

  // Test endpoint for manual processing
  fastify.post('/invoices/test/process-order', async (request, reply) => {
    try {
      const orderData = request.body as {
        orderId: string
        userId: string
        amount: string
        currency: string
        status?: string
      }

      // Simple validation
      if (
        !orderData.orderId ||
        !orderData.userId ||
        !orderData.amount ||
        !orderData.currency
      ) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: orderId, userId, amount, currency',
        })
      }

      await invoiceEventConsumer.processTestOrderEvent({
        ...orderData,
        status: orderData.status || 'pending',
      })

      return reply.code(200).send({
        success: true,
        message: 'Order processed successfully',
        data: { orderId: orderData.orderId },
      })
    } catch (error) {
      console.error('Error processing test order:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to process order',
      })
    }
  })
}
