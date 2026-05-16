import { z } from 'zod'

export const createSessionSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, 'At least one student is required'),
  type: z.enum(['private', 'group']).default('private'),
  scheduledAt: z.string().datetime('Must be a valid ISO datetime'),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  notes: z.string().max(1000).optional(),
})

export const updateSessionSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1).optional(),
  type: z.enum(['private', 'group']).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  notes: z.string().max(1000).optional(),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>
