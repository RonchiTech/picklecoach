import { z } from 'zod'

export const createProgressEntrySchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  sessionId: z.string().optional(),
  type: z.enum(['general', 'assessment', 'goal', 'milestone']).default('general'),
  content: z.string().min(1, 'Content is required').max(2000),
  skillTags: z.array(z.string().max(50)).max(10).default([]),
})

export const updateProgressEntrySchema = z.object({
  type: z.enum(['general', 'assessment', 'goal', 'milestone']).optional(),
  content: z.string().min(1).max(2000).optional(),
  skillTags: z.array(z.string().max(50)).max(10).optional(),
})

export type CreateProgressEntryInput = z.infer<typeof createProgressEntrySchema>
export type UpdateProgressEntryInput = z.infer<typeof updateProgressEntrySchema>
