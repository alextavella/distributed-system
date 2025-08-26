import { z } from 'zod'

// ===== BASE SCHEMAS =====
export const InvoiceStatusSchema = z.enum([
  'pending',
  'processing',
  'generated',
  'failed',
  'sent',
])

export const InvoiceSchema = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  invoiceNumber: z.string().min(1).max(50),
  status: InvoiceStatusSchema,
  amount: z.string().regex(/^\d+\.\d{2}$/),
  currency: z.string().length(3),
  orderData: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  generatedAt: z.date().nullable(),
  sentAt: z.date().nullable(),
})

export const InvoiceItemSchema = z.object({
  id: z.uuid(),
  invoiceId: z.uuid(),
  itemType: z.string().min(1).max(50),
  itemId: z.string().min(1).max(100),
  itemName: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  unitPrice: z.string().regex(/^\d+\.\d{2}$/),
  totalPrice: z.string().regex(/^\d+\.\d{2}$/),
})

// ===== API SCHEMAS =====
const InvoiceDto = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  invoiceNumber: z.string(),
  status: InvoiceStatusSchema,
  amount: z.string(),
  currency: z.string(),
  orderData: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  generatedAt: z.string().nullable(),
  sentAt: z.string().nullable(),
  items: z.array(z.any()).default([]),
})

// Params
export const InvoiceIdParams = z.object({
  id: z.uuid(),
})

export const OrderIdParams = z.object({
  orderId: z.uuid(),
})

// Query
export const InvoicesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: InvoiceStatusSchema.optional(),
  orderId: z.uuid().optional(),
})

// Body
export const UpdateStatusBody = z.object({
  status: InvoiceStatusSchema,
})

export const TestOrderBody = z.object({
  orderId: z.uuid(),
  userId: z.uuid(),
  subscriptionPlan: z.string().min(1).default('premium'),
  amount: z.string().regex(/^\d+\.\d{2}$/),
  currency: z.string().length(3),
  status: z.string().default('pending'),
})

// Export individual schemas for route usage
export {
  TestOrderBody as ProcessTestOrderBody,
  UpdateStatusBody as UpdateInvoiceStatusBody,
}

// Response
export const InvoiceResponse = InvoiceDto

export const InvoicesListResponse = z.object({
  invoices: z.array(InvoiceDto),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
})

export const InvoiceStatsResponse = z.object({
  total: z.number(),
  pending: z.number().optional(),
  generated: z.number().optional(),
})

export const UpdateStatusResponse = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  invoiceNumber: z.string(),
  status: InvoiceStatusSchema,
  amount: z.string(),
  currency: z.string(),
  orderData: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  generatedAt: z.string().nullable(),
  sentAt: z.string().nullable(),
  message: z.string(),
})

export const TestOrderResponse = z.object({
  orderId: z.uuid(),
  processedAt: z.string(),
  message: z.string(),
})

// Export individual schemas for route usage
export {
  TestOrderResponse as ProcessTestOrderResponse,
  UpdateStatusResponse as UpdateInvoiceStatusResponse,
}

export const ErrorResponse = z.object({
  error: z.string(),
  code: z.string().optional(),
})

// ===== TYPES =====
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>
export type Invoice = z.infer<typeof InvoiceSchema>
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>
