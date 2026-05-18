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

export const AGE_GROUPS = ['kids', 'teens', 'adults', 'seniors'] as const

export const LANGUAGES = [
  'filipino',
  'english',
  'cebuano',
  'ilocano',
  'hiligaynon',
  'bisaya',
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
  ageGroups: z.array(z.enum(AGE_GROUPS)).optional(),
  languages: z.array(z.enum(LANGUAGES)).optional(),
  coachingPhilosophy: z.string().max(300).optional(),
  socialLinks: z
    .object({
      facebook: z.string().url().optional().or(z.literal('')),
      instagram: z.string().url().optional().or(z.literal('')),
      youtube: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
})

export type UpdateCoachProfileInput = z.infer<typeof updateCoachProfileSchema>
