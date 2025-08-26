import { z } from 'zod'

// Invoice status enum
export const InvoiceStatusSchema = z.enum([
  'pending',
  'processing',
  'generated',
  'failed',
  'sent',
])

// Base invoice schema
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  invoiceNumber: z.string().min(1).max(50),
  status: InvoiceStatusSchema,
  amount: z.string().regex(/^\d+\.\d{2}$/),
  currency: z.string().length(3),
  orderData: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  generatedAt: z.date().nullable(),
  sentAt: z.date().nullable(),
})

// Invoice item schema
export const InvoiceItemSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  itemType: z.string().min(1).max(50),
  itemId: z.string().min(1).max(100),
  itemName: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  unitPrice: z.string().regex(/^\d+\.\d{2}$/),
  totalPrice: z.string().regex(/^\d+\.\d{2}$/),
})

// Invoice with items schema
export const InvoiceWithItemsSchema = InvoiceSchema.extend({
  items: z.array(InvoiceItemSchema),
})

// Query schemas
export const InvoiceQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: InvoiceStatusSchema.optional(),
  orderId: z.string().uuid().optional(),
})

// Response schemas
export const InvoiceResponseSchema = z.object({
  success: z.boolean(),
  data: InvoiceWithItemsSchema,
})

export const InvoicesListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    invoices: z.array(InvoiceWithItemsSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      pages: z.number(),
    }),
  }),
})

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

// Error response schema
export const ErrorResponseSchema = z.object({
  success: z.boolean().default(false),
  error: z.string(),
  code: z.string().optional(),
})

// Types
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>
export type Invoice = z.infer<typeof InvoiceSchema>
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>
export type InvoiceWithItems = z.infer<typeof InvoiceWithItemsSchema>
export type InvoiceQuery = z.infer<typeof InvoiceQuerySchema>
export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>
export type InvoicesListResponse = z.infer<typeof InvoicesListResponseSchema>
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
