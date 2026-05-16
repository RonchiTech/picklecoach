import mongoose from 'mongoose'
import { IPayment, Payment } from './payment.model'
import type { PaymentMethod, PaymentStatus } from '@picklecoach/shared'

type CreateData = {
  coachId: string
  studentId: string
  sessionId?: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  notes?: string
  paidAt?: Date
}

export type PaymentUpdateData = {
  amount?: number
  method?: PaymentMethod
  status?: PaymentStatus
  notes?: string
  paidAt?: Date | null
}

export interface IPaymentRepository {
  findAllByCoach(
    coachId: string,
    page: number,
    limit: number
  ): Promise<{ payments: IPayment[]; total: number }>
  findById(id: string, coachId: string): Promise<IPayment | null>
  create(data: CreateData): Promise<IPayment>
  update(id: string, coachId: string, data: PaymentUpdateData): Promise<IPayment | null>
  delete(id: string, coachId: string): Promise<boolean>
  sumUnpaidByCoach(coachId: string): Promise<number>
}

export class PaymentRepository implements IPaymentRepository {
  async findAllByCoach(
    coachId: string,
    page: number,
    limit: number
  ): Promise<{ payments: IPayment[]; total: number }> {
    const skip = (page - 1) * limit
    const [payments, total] = await Promise.all([
      Payment.find({ coachId }).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      Payment.countDocuments({ coachId }),
    ])
    return { payments, total }
  }

  async findById(id: string, coachId: string): Promise<IPayment | null> {
    return Payment.findOne({ _id: id, coachId })
  }

  async create(data: CreateData): Promise<IPayment> {
    return Payment.create(data)
  }

  async update(id: string, coachId: string, data: PaymentUpdateData): Promise<IPayment | null> {
    const { paidAt, ...rest } = data
    const ops: Record<string, unknown> = { $set: rest }
    if (paidAt === null) ops.$unset = { paidAt: '' }
    else if (paidAt !== undefined) (ops.$set as Record<string, unknown>).paidAt = paidAt
    return Payment.findOneAndUpdate({ _id: id, coachId }, ops, { new: true })
  }

  async delete(id: string, coachId: string): Promise<boolean> {
    const result = await Payment.deleteOne({ _id: id, coachId })
    return result.deletedCount === 1
  }

  async sumUnpaidByCoach(coachId: string): Promise<number> {
    const result = await Payment.aggregate([
      {
        $match: {
          coachId: new mongoose.Types.ObjectId(coachId),
          status: { $in: ['unpaid', 'partial'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])
    return result[0]?.total ?? 0
  }
}
