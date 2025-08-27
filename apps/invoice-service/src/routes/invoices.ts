import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { InvoiceService } from '../services/invoice.service.js'
import {
  ErrorResponseSchema,
  InvoiceIdParamsSchema,
  InvoiceResponseSchema,
  InvoicesListResponseSchema,
  InvoicesQuerySchema,
  UpdateStatusBodySchema,
} from '../types/invoice.js'

export async function invoiceRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()
  const invoiceService = new InvoiceService()

  // Get invoice by ID
  app.get(
    '/invoices/:id',
    {
      schema: {
        description: 'Get invoice by ID',
        tags: ['invoices'],
        summary: 'Get Invoice by ID',
        params: InvoiceIdParamsSchema,
        response: {
          200: InvoiceResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
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
          status: invoice.status,
          amount: invoice.amount,
          currency: invoice.currency,
          orderData: invoice.orderData || {},
          createdAt: invoice.createdAt,
          updatedAt: invoice.updatedAt,
          generatedAt: invoice.generatedAt,
        })
      } catch (error) {
        console.error('Error getting invoice:', error)
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )

  // Get all invoices
  app.get(
    '/invoices',
    {
      schema: {
        description: 'List invoices with pagination and filtering',
        tags: ['invoices'],
        summary: 'List Invoices',
        querystring: InvoicesQuerySchema,
        response: {
          200: InvoicesListResponseSchema,
          500: ErrorResponseSchema,
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
            status: invoice.status,
            amount: invoice.amount,
            currency: invoice.currency,
            orderData: invoice.orderData || {},
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
            generatedAt: invoice.generatedAt,
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

  // Update invoice status
  app.patch(
    '/invoices/:id/status',
    {
      schema: {
        description: 'Update invoice status',
        tags: ['invoices'],
        summary: 'Update Invoice Status',
        body: UpdateStatusBodySchema,
        params: InvoiceIdParamsSchema,
        response: {
          200: InvoiceResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const statusData = request.body
        const invoice = await invoiceService.updateStatus(id, statusData)

        return reply.code(200).send({
          id: invoice.id,
          orderId: invoice.orderId,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          amount: invoice.amount,
          currency: invoice.currency,
          orderData: invoice.orderData || {},
          createdAt: invoice.createdAt,
          updatedAt: invoice.updatedAt,
          generatedAt: invoice.generatedAt,
        })
      } catch (error) {
        console.error('Error updating invoice status:', error)
        if (error instanceof Error && error.message === 'Invoice not found') {
          return reply.code(404).send({
            error: 'Invoice not found',
          })
        }
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    },
  )
}
