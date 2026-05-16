import { createError } from '../../middleware/error.middleware'
import type { CreatePaymentInput, UpdatePaymentInput } from '@picklecoach/shared'
import type { IPayment } from './payment.model'
import type { IPaymentRepository, PaymentUpdateData } from './payment.repository'

export interface PaymentListResult {
  payments: IPayment[]
  total: number
  page: number
  limit: number
}

export class PaymentService {
  constructor(private repo: IPaymentRepository) {}

  async list(coachId: string, page: number, limit: number): Promise<PaymentListResult> {
    const { payments, total } = await this.repo.findAllByCoach(coachId, page, limit)
    return { payments, total, page, limit }
  }

  async getOne(coachId: string, id: string): Promise<IPayment> {
    const payment = await this.repo.findById(id, coachId)
    if (!payment) throw createError('Payment not found', 404, 'PAYMENT_NOT_FOUND')
    return payment
  }

  async create(coachId: string, input: CreatePaymentInput): Promise<IPayment> {
    const paidAt = input.status === 'paid' ? new Date() : undefined
    return this.repo.create({ coachId, ...input, paidAt })
  }

  async update(coachId: string, id: string, input: UpdatePaymentInput): Promise<IPayment> {
    const data: PaymentUpdateData = { ...input }
    if (input.status === 'paid') data.paidAt = new Date()
    else if (input.status !== undefined) data.paidAt = null
    const payment = await this.repo.update(id, coachId, data)
    if (!payment) throw createError('Payment not found', 404, 'PAYMENT_NOT_FOUND')
    return payment
  }

  async delete(coachId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(id, coachId)
    if (!deleted) throw createError('Payment not found', 404, 'PAYMENT_NOT_FOUND')
  }
}
