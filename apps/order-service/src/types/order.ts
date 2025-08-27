import { z } from 'zod'

/**
 * Order Types and Schemas
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
export const OrderItemSchema = z.object({
  id: z.uuid().optional(),
  orderId: z.uuid(),
  itemType: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().int().positive(), // decimal in DB, stored as number for calculations
  unitPrice: z.number().positive(), // decimal in DB, stored as number for calculations
  totalPrice: z.number().positive(), // decimal in DB, stored as number for calculations
  createdAt: z.date().optional(),
})

export const OrderSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  subscriptionPlan: z.string().min(1),
  amount: z.number().positive(), // decimal in DB, stored as number for calculations
  currency: z.string().length(3).default('USD'),
  status: z
    .enum(['pending', 'processing', 'completed', 'cancelled', 'refunded'])
    .default('pending'),
  paymentMethod: z.string().nullable(),
  transactionId: z.string().nullable(),
  metadata: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  items: z.array(OrderItemSchema).optional(),
})

// Request/Response schemas
export const CreateOrderBodySchema = z.object({
  userId: z.uuid(),
  subscriptionPlan: z.string().min(1),
  amount: z.number().positive(), // decimal in DB, stored as number for calculations
  currency: z.string().length(3).default('USD'),
  paymentMethod: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  items: z.array(OrderItemSchema).optional(),
})

export const OrderIdParamsSchema = z.object({
  id: z.uuid(),
})

export const OrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  userId: z.uuid().optional(),
  status: z
    .enum(['pending', 'processing', 'completed', 'cancelled', 'refunded'])
    .optional(),
})

export const UpdateOrderStatusBodySchema = z.object({
  status: z.enum([
    'pending',
    'processing',
    'completed',
    'cancelled',
    'refunded',
  ]),
})

// Response schemas
export const OrderResponseSchema = OrderSchema.omit({
  items: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const OrderWithItemsResponseSchema = OrderSchema.omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const OrdersListResponseSchema = z.object({
  orders: z.array(OrderResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export const OrderStatsResponseSchema = z.object({
  totalOrders: z.number(),
  pendingOrders: z.number(),
  completedOrders: z.number(),
  totalRevenue: z.string(),
})

export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
})

// TypeScript types
export type Order = z.infer<typeof OrderSchema>
export type OrderItem = z.infer<typeof OrderItemSchema>
export type CreateOrderData = z.infer<typeof CreateOrderBodySchema>
export type OrderResponse = z.infer<typeof OrderResponseSchema>
export type OrderWithItemsResponse = z.infer<
  typeof OrderWithItemsResponseSchema
>
export type OrdersListResponse = z.infer<typeof OrdersListResponseSchema>
export type OrderStatsResponse = z.infer<typeof OrderStatsResponseSchema>
export type OrdersQuery = z.infer<typeof OrdersQuerySchema>
export type UpdateOrderStatusData = z.infer<typeof UpdateOrderStatusBodySchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
