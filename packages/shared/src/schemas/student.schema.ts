import { z } from 'zod'

export const REFERRAL_SOURCES = [
  'word-of-mouth',
  'social-media',
  'directory',
  'friend',
  'other',
] as const

export const createStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(7).max(20).optional().or(z.literal('')),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).default('beginner'),
  notes: z.string().max(1000).optional(),
  referralSource: z.enum(REFERRAL_SOURCES).optional(),
})

export const updateStudentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(7).max(20).optional().or(z.literal('')),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).optional(),
  notes: z.string().max(1000).optional(),
  referralSource: z.enum(REFERRAL_SOURCES).optional(),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
