import { z } from 'zod'

export const updateGcashSettingsSchema = z.object({
  number: z.string().min(1, 'GCash number is required'),
  name: z.string().min(1, 'Account name is required'),
  qrUrl: z.string().url().optional().or(z.literal('')),
})
export type UpdateGcashSettingsInput = z.infer<typeof updateGcashSettingsSchema>
