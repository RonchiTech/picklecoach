import mongoose, { Document, Schema } from 'mongoose'
import type { PaymentMethod, PaymentStatus } from '@picklecoach/shared'

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId
  coachId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  sessionId?: mongoose.Types.ObjectId
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  notes?: string
  paidAt?: Date
}

const paymentSchema = new Schema<IPayment>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session' },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['cash', 'gcash', 'bank_transfer', 'other'], default: 'cash' },
    status: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'unpaid' },
    notes: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
)

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema)
