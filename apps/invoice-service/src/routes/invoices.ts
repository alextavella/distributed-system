import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { invoiceEventConsumer } from '../services/invoice-event-consumer.js'
import { InvoiceService } from '../services/invoice.service.js'
import {
  ErrorResponse,
  InvoiceIdParams,
  InvoiceResponse,
  InvoicesListResponse,
  InvoicesQuery,
  InvoiceStatsResponse,
  OrderIdParams,
  TestOrderBody,
  TestOrderResponse,
  UpdateStatusBody,
  UpdateStatusResponse,
} from '../types/invoice.js'

export async function invoiceRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()
  const invoiceService = new InvoiceService()

  // List invoices with pagination and filtering
  app.get(
    '/invoices',
    {
      schema: {
        description: 'List invoices with pagination and optional filtering',
        tags: ['invoices'],
        summary: 'List Invoices',
        querystring: InvoicesQuery,
        response: {
          200: InvoicesListResponse,
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const query = request.query
        const result = await invoiceService.getInvoices(query)

        return reply.code(200).send({
          invoices: result.invoices.map(invoice => ({
            id: invoice.id,
            orderId: invoice.orderId,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status as any,
            amount: invoice.amount,
            currency: invoice.currency,
            orderData: invoice.orderData as string | null,
            createdAt: invoice.createdAt.toISOString(),
            updatedAt: invoice.updatedAt.toISOString(),
            generatedAt: invoice.generatedAt?.toISOString() || null,
            sentAt: null,
            items: invoice.items || [],
          })),
          pagination: result.pagination,
        })
      } catch (error) {
        console.error('Error listing invoices:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )

  // Get invoice by ID
  app.get(
    '/invoices/:id',
    {
      schema: {
        description: 'Get invoice by ID',
        tags: ['invoices'],
        summary: 'Get Invoice by ID',
        params: InvoiceIdParams,
        response: {
          200: InvoiceResponse,
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const invoice = await invoiceService.getInvoiceById(id)

        if (!invoice) {
          return reply.code(404).send({
            error: 'Invoice not found',
          })
        }

        return reply.code(200).send({
          id: invoice.id,
          orderId: invoice.orderId,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status as any,
          amount: invoice.amount,
          currency: invoice.currency,
          orderData: invoice.orderData as string | null,
          createdAt: invoice.createdAt.toISOString(),
          updatedAt: invoice.updatedAt.toISOString(),
          generatedAt: invoice.generatedAt?.toISOString() || null,
          sentAt: null,
          items: [],
        })
      } catch (error) {
        console.error('Error getting invoice by ID:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )

  // Get invoice by Order ID
  app.get(
    '/invoices/order/:orderId',
    {
      schema: {
        description: 'Get invoice by Order ID',
        tags: ['invoices'],
        summary: 'Get Invoice by Order ID',
        params: OrderIdParams,
        response: {
          200: InvoiceResponse,
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const { orderId } = request.params
        const invoice = await invoiceService.findByOrderId(orderId)

        if (!invoice) {
          return reply.code(404).send({
            error: 'Invoice not found for this order ID',
          })
        }

        return reply.code(200).send({
          id: invoice.id,
          orderId: invoice.orderId,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status as any,
          amount: invoice.amount,
          currency: invoice.currency,
          orderData: invoice.orderData as string | null,
          createdAt: invoice.createdAt.toISOString(),
          updatedAt: invoice.updatedAt.toISOString(),
          generatedAt: invoice.generatedAt?.toISOString() || null,
          sentAt: null,
          items: [],
        })
      } catch (error) {
        console.error('Error getting invoice by Order ID:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )

  // Get invoice statistics
  app.get(
    '/invoices/stats',
    {
      schema: {
        description: 'Get invoice statistics and counts',
        tags: ['invoices'],
        summary: 'Get Invoice Statistics',
        response: {
          200: InvoiceStatsResponse,
          500: ErrorResponse,
        },
      },
    },
    async (_request, reply) => {
      try {
        const stats = await invoiceService.getInvoiceStats()
        return reply.code(200).send(stats)
      } catch (error) {
        console.error('Error getting invoice statistics:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )

  // Update invoice status
  app.patch(
    '/invoices/:id/status',
    {
      schema: {
        description: 'Update invoice status',
        tags: ['invoices'],
        summary: 'Update Invoice Status',
        params: InvoiceIdParams,
        body: UpdateStatusBody,
        response: {
          200: UpdateStatusResponse,
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const { status } = request.body as { status: string }

        const updatedInvoice = await invoiceService.updateStatus(id, status)

        if (!updatedInvoice) {
          return reply.code(404).send({
            error: 'Invoice not found',
          })
        }

        return reply.code(200).send({
          id: updatedInvoice.id,
          orderId: updatedInvoice.orderId,
          invoiceNumber: updatedInvoice.invoiceNumber,
          status: updatedInvoice.status as any,
          amount: updatedInvoice.amount,
          currency: updatedInvoice.currency,
          orderData: updatedInvoice.orderData as string | null,
          createdAt: updatedInvoice.createdAt.toISOString(),
          updatedAt: updatedInvoice.updatedAt.toISOString(),
          generatedAt: updatedInvoice.generatedAt?.toISOString() || null,
          sentAt: null,
          message: 'Invoice status updated successfully',
        })
      } catch (error) {
        console.error('Error updating invoice status:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )

  // Test endpoint to manually process order events
  app.post(
    '/invoices/test/process-order',
    {
      schema: {
        description:
          'Manually process order event for testing (development only)',
        tags: ['invoices', 'testing'],
        summary: 'Process Test Order Event',
        body: TestOrderBody,
        response: {
          200: TestOrderResponse,
          400: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const orderData = request.body as any

        await invoiceEventConsumer.processTestOrderEvent(orderData)

        return reply.code(200).send({
          orderId: orderData.orderId,
          processedAt: new Date().toISOString(),
          message: 'Order processed successfully',
        })
      } catch (error) {
        console.error('Error processing test order event:', error)
        return reply.code(500).send({
          error: 'Failed to process order event',
        })
      }
    },
  )
}
