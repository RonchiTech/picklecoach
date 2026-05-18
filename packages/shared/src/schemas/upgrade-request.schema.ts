import { z } from 'zod'

export const submitUpgradeRequestSchema = z.object({
  months: z
    .string()
    .regex(/^(1|3|6|12)$/, 'months must be 1, 3, 6, or 12')
    .transform(Number),
  promoCode: z.string().optional(),
})
export type SubmitUpgradeRequestInput = z.infer<typeof submitUpgradeRequestSchema>

export const validatePromoSchema = z.object({
  code: z
    .string()
    .min(1)
    .transform((s) => s.trim().toUpperCase()),
  months: z.coerce.number().refine((n) => [1, 3, 6, 12].includes(n), 'Invalid months'),
})
export type ValidatePromoInput = z.infer<typeof validatePromoSchema>

export const reviewUpgradeRequestSchema = z.object({
  action: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
})
export type ReviewUpgradeRequestInput = z.infer<typeof reviewUpgradeRequestSchema>
