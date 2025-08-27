import { z } from 'zod'

// Base schemas
export const OrderItemSchema = z.object({
  id: z.uuid().optional(),
  itemType: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.string().min(1),
  unitPrice: z.string().min(1),
  totalPrice: z.string().min(1),
  createdAt: z.date().optional(),
})

export const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  subscriptionPlan: z.string().min(1),
  amount: z.string().min(1),
  currency: z.string().length(3).default('USD'),
  status: z
    .enum(['pending', 'processing', 'completed', 'cancelled', 'refunded'])
    .default('pending'),
  paymentMethod: z.string().nullable(),
  transactionId: z.string().nullable(),
  metadata: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(OrderItemSchema).optional(),
})

// Request/Response schemas
export const CreateOrderBodySchema = z.object({
  userId: z.uuid(),
  subscriptionPlan: z.string().min(1),
  amount: z.string().min(1),
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
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const OrderWithItemsResponseSchema = OrderSchema.omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  createdAt: z.string(),
  updatedAt: z.string(),
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
