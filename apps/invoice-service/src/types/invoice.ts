import { z } from 'zod'

/**
 * Invoice Types and Schemas
 *
 * IMPORTANT: We use z.uuid() instead of z.string().uuid() because:
 * - z.uuid() is more specific and validates the exact UUID format
 * - z.string().uuid() allows any string that matches UUID pattern
 * - z.uuid() provides better type inference and validation
 * - This is the recommended approach for UUID fields in Zod
 */

// Base schemas
export const InvoiceItemSchema = z.object({
  id: z.uuid().optional(),
  invoiceId: z.uuid(),
  itemName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
})

export const InvoiceSchema = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  invoiceNumber: z.string().min(1),
  status: z.enum(['pending', 'generated']).default('pending'),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  orderData: z.record(z.string(), z.any()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  generatedAt: z.string().nullable(),
  items: z.array(InvoiceItemSchema).optional(),
})

// Request/Response schemas
export const InvoiceIdParamsSchema = z.object({
  id: z.uuid(),
})

export const OrderIdParamsSchema = z.object({
  orderId: z.uuid(),
})

export const InvoicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['pending', 'generated']).optional(),
  orderId: z.uuid().optional(),
})

export const UpdateStatusBodySchema = z.object({
  status: z.enum(['pending', 'generated']),
})

// Response schemas
export const InvoiceResponseSchema = InvoiceSchema.omit({
  items: true,
  createdAt: true,
  updatedAt: true,
  generatedAt: true,
}).extend({
  createdAt: z.string(),
  updatedAt: z.string(),
  generatedAt: z.string().nullable(),
})

export const InvoiceWithItemsResponseSchema = InvoiceSchema.omit({
  createdAt: true,
  updatedAt: true,
  generatedAt: true,
}).extend({
  createdAt: z.string(),
  updatedAt: z.string(),
  generatedAt: z.string().nullable(),
})

export const InvoicesListResponseSchema = z.object({
  invoices: z.array(InvoiceResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export const UpdateStatusResponseSchema = InvoiceResponseSchema

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
  details: z.any().optional(),
})

// TypeScript types
export type Invoice = z.infer<typeof InvoiceSchema>
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>
export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>
export type InvoiceWithItemsResponse = z.infer<
  typeof InvoiceWithItemsResponseSchema
>
export type InvoicesListResponse = z.infer<typeof InvoicesListResponseSchema>
export type UpdateStatusResponse = z.infer<typeof UpdateStatusResponseSchema>
export type InvoicesQuery = z.infer<typeof InvoicesQuerySchema>
export type UpdateStatusData = z.infer<typeof UpdateStatusBodySchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
