import { z } from 'zod'

export const SPECIALIZATIONS = [
  'beginner',
  'intermediate',
  'advanced',
  'dinking',
  'serve',
  '3rd-shot-drop',
  'footwork',
  'strategy',
  'doubles',
  'singles',
] as const

export const updateCoachProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').optional(),
  bio: z.string().optional(),
  city: z.string().optional(),
  specializations: z.array(z.enum(SPECIALIZATIONS)).optional(),
  sessionTypes: z.array(z.enum(['private', 'group'])).optional(),
  privateRate: z.number().min(0).optional(),
  groupRate: z.number().min(0).optional(),
  ratesNote: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
  showContactInfo: z.boolean().optional(),
  isPublic: z.boolean().optional(),
})

export type UpdateCoachProfileInput = z.infer<typeof updateCoachProfileSchema>
