import { z } from 'zod'

// Base schemas
export const InvoiceItemSchema = z.object({
  id: z.uuid().optional(),
  invoiceId: z.uuid(),
  itemName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.string().min(1),
  totalPrice: z.string().min(1),
})

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  invoiceNumber: z.string().min(1),
  status: z.enum(['pending', 'generated']).default('pending'),
  amount: z.string().min(1),
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

export const TestOrderBodySchema = z.object({
  orderId: z.string().uuid(),
  customerId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  orderData: z.record(z.string(), z.any()).optional(),
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

export const TestOrderResponseSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  invoiceNumber: z.string(),
  status: z.string(),
  amount: z.string(),
  currency: z.string(),
  orderData: z.record(z.string(), z.any()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

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
export type TestOrderResponse = z.infer<typeof TestOrderResponseSchema>
export type InvoicesQuery = z.infer<typeof InvoicesQuerySchema>
export type UpdateStatusData = z.infer<typeof UpdateStatusBodySchema>
export type TestOrderData = z.infer<typeof TestOrderBodySchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
