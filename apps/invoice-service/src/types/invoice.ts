/**
 * Invoice Service Types
 *
 * IMPORTANT: We use z.number() for monetary values and quantities because:
 * - Monetary values should be numbers for proper mathematical operations
 * - Quantities should be integers for counting operations
 * - This provides better type safety and validation
 * - Database stores these as decimal/numeric types but we handle them as numbers in the application
 * - When inserting into database, we convert numbers to strings for Drizzle's decimal type
 * - When fetching from database, we convert strings back to numbers for application logic
 */

import { z } from 'zod'

/**
 * Invoice Types and Schemas
 *
 * IMPORTANT: We use z.uuid() instead of z.string().uuid() because:
 * - z.uuid() is more specific and validates the exact UUID format
 * - z.string().uuid() allows any string that matches UUID pattern
 * - z.uuid() provides better type inference and validation
 * - This is the recommended approach for UUID fields in Zod
 *
 * IMPORTANT: We use z.number() for monetary values and quantities because:
 * - Monetary values should be numbers for proper mathematical operations
 * - Quantities should be integers for counting operations
 * - This provides better type safety and validation
 * - Database stores these as decimal/numeric types but we handle them as numbers in the application
 */

// Base schemas
export const InvoiceItemSchema = z.object({
  id: z.uuid().optional(),
  invoiceId: z.uuid(),
  itemName: z.string().min(1),
  quantity: z.number().int().positive(), // decimal in DB, stored as number for calculations
  unitPrice: z.number().positive(), // decimal in DB, stored as number for calculations
  totalPrice: z.number().positive(), // decimal in DB, stored as number for calculations
})

export const InvoiceSchema = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  invoiceNumber: z.string().min(1),
  status: z.enum(['pending', 'generated']).default('pending'),
  amount: z.number().positive(), // decimal in DB, stored as number for calculations
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
export type CreateInvoiceData = Omit<
  Invoice,
  'id' | 'createdAt' | 'updatedAt' | 'generatedAt'
>
export type CreateInvoiceItemData = Omit<InvoiceItem, 'id'>
export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>
export type InvoiceWithItemsResponse = z.infer<
  typeof InvoiceWithItemsResponseSchema
>
export type InvoicesListResponse = z.infer<typeof InvoicesListResponseSchema>
export type UpdateStatusResponse = z.infer<typeof UpdateStatusBodySchema>
export type InvoicesQuery = z.infer<typeof InvoicesQuerySchema>
export type UpdateStatusData = z.infer<typeof UpdateStatusBodySchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
