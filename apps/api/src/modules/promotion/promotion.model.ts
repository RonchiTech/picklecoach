import mongoose, { Document, Schema } from 'mongoose'
import type { DiscountType, SubscriptionTier } from '@picklecoach/shared'

export interface IPromotion extends Document {
  _id: mongoose.Types.ObjectId
  code: string
  discountType: DiscountType
  discountValue: number
  applicableTiers: SubscriptionTier[]
  expiresAt?: Date
  maxRedemptions?: number
  currentRedemptions: number
  isActive: boolean
  createdBy: mongoose.Types.ObjectId
}

const promotionSchema = new Schema<IPromotion>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    applicableTiers: [{ type: String, enum: ['starter', 'pro', 'team'] }],
    expiresAt: { type: Date },
    maxRedemptions: { type: Number },
    currentRedemptions: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export interface IRedemption extends Document {
  _id: mongoose.Types.ObjectId
  promotionId: mongoose.Types.ObjectId
  coachId: mongoose.Types.ObjectId
  discountApplied: number
  redeemedAt: Date
}

const redemptionSchema = new Schema<IRedemption>({
  promotionId: { type: Schema.Types.ObjectId, ref: 'Promotion', required: true, index: true },
  coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  discountApplied: { type: Number, required: true },
  redeemedAt: { type: Date, default: Date.now },
})

export const Promotion = mongoose.model<IPromotion>('Promotion', promotionSchema)
export const Redemption = mongoose.model<IRedemption>('Redemption', redemptionSchema)
