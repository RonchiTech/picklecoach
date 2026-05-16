import { z } from 'zod'

export const createPaymentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  sessionId: z.string().optional(),
  amount: z.number().min(0, 'Amount must be non-negative'),
  method: z.enum(['cash', 'gcash', 'bank_transfer', 'other']).default('cash'),
  status: z.enum(['paid', 'unpaid', 'partial']).default('unpaid'),
  notes: z.string().max(500).optional(),
})

export const updatePaymentSchema = z.object({
  amount: z.number().min(0).optional(),
  method: z.enum(['cash', 'gcash', 'bank_transfer', 'other']).optional(),
  status: z.enum(['paid', 'unpaid', 'partial']).optional(),
  notes: z.string().max(500).optional(),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
