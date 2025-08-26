import { z } from 'zod'

// Zod Schemas for validation
export const CreateOrderSchema = z.object({
  userId: z.string().uuid().describe('User ID who placed the order'),
  subscriptionPlan: z
    .string()
    .min(1)
    .describe('Type of subscription plan being ordered'),
  currency: z
    .string()
    .length(3)
    .default('USD')
    .describe('Currency code (ISO 4217)'),
  paymentMethod: z
    .string()
    .nullable()
    .describe('Payment method used for the order'),
  metadata: z
    .string()
    .nullable()
    .describe('Additional metadata as JSON string'),
  items: z
    .array(
      z.object({
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
      }),
    )
    .min(1)
    .describe('Array of items in the order'),
})

// Response Schemas
export const OrderResponseSchema = z.object({
  success: z.boolean().describe('Indicates if the operation was successful'),
  data: z
    .object({
      id: z.string().uuid().describe('Unique order identifier'),
      userId: z.string().uuid().describe('User ID who placed the order'),
      subscriptionPlan: z.string().describe('Type of subscription plan'),
      amount: z.string().describe('Total amount of the order'),
      currency: z.string().describe('Currency code'),
      status: z
        .enum(['pending', 'processing', 'completed', 'cancelled', 'refunded'])
        .describe('Current status of the order'),
      paymentMethod: z.string().nullable().describe('Payment method used'),
      transactionId: z
        .string()
        .nullable()
        .describe('Transaction ID from payment processor'),
      metadata: z.string().nullable().describe('Additional metadata'),
      createdAt: z.date().describe('Order creation timestamp'),
      updatedAt: z.date().describe('Last update timestamp'),
    })
    .describe('Order data'),
})

export const ErrorResponseSchema = z.object({
  success: z.boolean().describe('Always false for error responses'),
  error: z.string().describe('Error type or category'),
  message: z.string().optional().describe('Detailed error message'),
  statusCode: z.number().optional().describe('HTTP status code'),
  details: z.any().optional().describe('Additional error details'),
})

// TypeScript types inferred from schemas
export type CreateOrderRequest = z.infer<typeof CreateOrderSchema>
export type OrderResponse = z.infer<typeof OrderResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
