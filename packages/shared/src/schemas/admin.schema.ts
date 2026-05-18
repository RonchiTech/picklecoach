import { z } from 'zod'

export const updateCoachSubscriptionSchema = z.object({
  tier: z.enum(['starter', 'pro', 'team']),
  proEndsAt: z.string().datetime().optional(),
})
export type UpdateCoachSubscriptionInput = z.infer<typeof updateCoachSubscriptionSchema>
