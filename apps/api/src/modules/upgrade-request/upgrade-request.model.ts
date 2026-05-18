import mongoose, { Document, Schema } from 'mongoose'
import type { UpgradeRequestStatus } from '@picklecoach/shared'

export interface IUpgradeRequest extends Document {
  _id: mongoose.Types.ObjectId
  coachId: mongoose.Types.ObjectId
  months: number
  amountDue: number
  discountApplied: number
  promoCode?: string
  receiptUrl: string
  status: UpgradeRequestStatus
  notes?: string
  reviewedAt?: Date
  reviewedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const schema = new Schema<IUpgradeRequest>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    months: { type: Number, required: true, enum: [1, 3, 6, 12] },
    amountDue: { type: Number, required: true },
    discountApplied: { type: Number, default: 0 },
    promoCode: { type: String },
    receiptUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    notes: { type: String },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

export const UpgradeRequest = mongoose.model<IUpgradeRequest>('UpgradeRequest', schema)
