import { z } from 'zod'

export const applyPromoSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .transform((s) => s.trim().toUpperCase()),
})
export type ApplyPromoInput = z.infer<typeof applyPromoSchema>

export const createPromotionSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be at most 20 characters')
    .transform((s) => s.trim().toUpperCase()),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive('Discount value must be positive'),
  applicableTiers: z
    .array(z.enum(['starter', 'pro', 'team']))
    .min(1, 'At least one tier is required'),
  expiresAt: z.string().datetime().optional(),
  maxRedemptions: z.number().int().positive().optional(),
})
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>

export const updatePromotionSchema = z.object({
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
  maxRedemptions: z.number().int().positive().optional(),
})
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>
