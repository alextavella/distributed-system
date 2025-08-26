import { z } from 'zod'

// ===== RESPONSE SCHEMAS =====
export const HealthResponse = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  service: z.string(),
  timestamp: z.string(),
  version: z.string(),
})

export const DetailedHealthResponse = HealthResponse.extend({
  dependencies: z.object({
    database: z.object({
      status: z.enum(['healthy', 'unhealthy']),
      responseTime: z.number().optional(),
    }),
    messagebroker: z.object({
      status: z.enum(['healthy', 'unhealthy']),
      connected: z.boolean(),
    }),
  }),
})

export const HealthErrorResponse = HealthResponse.extend({
  error: z.string(),
})

export const ReadinessResponse = z.object({
  status: z.enum(['ready', 'not ready']),
  ready: z.boolean(),
  error: z.string().optional(),
})

// ===== TYPES =====
export type HealthStatus = z.infer<typeof HealthResponse>
export type DetailedHealthStatus = z.infer<typeof DetailedHealthResponse>
