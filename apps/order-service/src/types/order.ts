import { z } from 'zod'

// ===== BASE SCHEMAS =====
export const OrderStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'cancelled',
  'refunded',
])

export const OrderItemSchema = z.object({
  itemType: z
    .string()
    .min(1)
    .describe('Type of item (e.g., subscription, addon)'),
  itemId: z.string().min(1).describe('Unique identifier for the item'),
  itemName: z.string().min(1).describe('Human-readable name of the item'),
  quantity: z
    .string()
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Quantity must be a positive number',
    })
    .describe('Quantity of the item'),
  unitPrice: z
    .string()
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Unit price must be a non-negative number',
    })
    .describe('Unit price of the item'),
})

export const OrderSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  subscriptionPlan: z.string(),
  amount: z.string(),
  currency: z.string().length(3),
  status: OrderStatusSchema,
  paymentMethod: z.string().nullable(),
  transactionId: z.string().nullable(),
  metadata: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// ===== API SCHEMAS =====
const OrderDto = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  subscriptionPlan: z.string(),
  amount: z.string(),
  currency: z.string(),
  status: OrderStatusSchema,
  paymentMethod: z.string().nullable(),
  transactionId: z.string().nullable(),
  metadata: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Params
export const OrderIdParams = z.object({
  id: z.uuid(),
})

// Query
export const OrdersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: OrderStatusSchema.optional(),
  userId: z.uuid().optional(),
})

// Body
export const CreateOrderBody = z.object({
  userId: z.uuid().describe('User ID who placed the order'),
  subscriptionPlan: z
    .string()
    .min(1)
    .describe('Type of subscription plan being ordered'),
  amount: z
    .string()
    .regex(/^\d+\.\d{2}$/)
    .describe('Total amount of the order'),
  currency: z
    .string()
    .length(3)
    .default('USD')
    .describe('Currency code (ISO 4217)'),
  paymentMethod: z
    .string()
    .nullable()
    .optional()
    .describe('Payment method used for the order'),
  metadata: z
    .string()
    .nullable()
    .optional()
    .describe('Additional metadata as JSON string'),
  items: z
    .array(OrderItemSchema)
    .min(1)
    .optional()
    .describe('Array of items in the order'),
})

// Response
export const OrderResponse = OrderDto

export const OrdersListResponse = z.object({
  orders: z.array(OrderDto),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
})

export const OrderStatsResponse = z.object({
  total: z.number(),
  pending: z.number().optional(),
  processing: z.number().optional(),
  completed: z.number().optional(),
  cancelled: z.number().optional(),
})

export const ErrorResponse = z.object({
  error: z.string(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
  details: z.any().optional(),
})

// ===== TYPES =====
export type OrderStatus = z.infer<typeof OrderStatusSchema>
export type Order = z.infer<typeof OrderSchema>
export type OrderItem = z.infer<typeof OrderItemSchema>
