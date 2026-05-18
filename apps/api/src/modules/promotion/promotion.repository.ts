import mongoose from 'mongoose'
import type { PublicRedemption, UpdatePromotionInput } from '@picklecoach/shared'
import { Promotion, Redemption } from './promotion.model'
import type { IPromotion, IRedemption } from './promotion.model'

type CreatePromotionData = {
  code: string
  discountType: string
  discountValue: number
  applicableTiers: string[]
  expiresAt?: string
  maxRedemptions?: number
  createdBy: string
}

type CreateRedemptionData = {
  promotionId: string
  coachId: string
  discountApplied: number
}

export interface IPromotionRepository {
  findByCode(code: string): Promise<IPromotion | null>
  findAll(): Promise<IPromotion[]>
  create(data: CreatePromotionData): Promise<IPromotion>
  update(id: string, data: UpdatePromotionInput): Promise<IPromotion | null>
  deactivate(id: string): Promise<boolean>
  createRedemption(data: CreateRedemptionData): Promise<IRedemption>
  hasCoachRedeemed(promotionId: string, coachId: string): Promise<boolean>
  incrementRedemptions(promotionId: string): Promise<void>
  findRedemptionsByPromotion(promotionId: string): Promise<PublicRedemption[]>
}

export class PromotionRepository implements IPromotionRepository {
  async findByCode(code: string): Promise<IPromotion | null> {
    return Promotion.findOne({ code: code.toUpperCase() })
  }

  async findAll(): Promise<IPromotion[]> {
    return Promotion.find().sort({ createdAt: -1 })
  }

  async create(data: CreatePromotionData): Promise<IPromotion> {
    return Promotion.create(data)
  }

  async update(id: string, data: UpdatePromotionInput): Promise<IPromotion | null> {
    return Promotion.findByIdAndUpdate(id, { $set: data }, { new: true })
  }

  async deactivate(id: string): Promise<boolean> {
    const result = await Promotion.findByIdAndUpdate(id, { isActive: false })
    return result !== null
  }

  async createRedemption(data: CreateRedemptionData): Promise<IRedemption> {
    return Redemption.create(data)
  }

  async hasCoachRedeemed(promotionId: string, coachId: string): Promise<boolean> {
    const count = await Redemption.countDocuments({ promotionId, coachId })
    return count > 0
  }

  async incrementRedemptions(promotionId: string): Promise<void> {
    await Promotion.findByIdAndUpdate(promotionId, { $inc: { currentRedemptions: 1 } })
  }

  async findRedemptionsByPromotion(promotionId: string): Promise<PublicRedemption[]> {
    type RedemptionRow = {
      _id: mongoose.Types.ObjectId
      discountApplied: number
      redeemedAt: Date
      coach: { name: string; email: string } | null
    }
    const rows = await Redemption.aggregate<RedemptionRow>([
      { $match: { promotionId: new mongoose.Types.ObjectId(promotionId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'coachId',
          foreignField: '_id',
          as: 'coach',
          pipeline: [{ $project: { name: 1, email: 1 } }],
        },
      },
      { $unwind: { path: '$coach', preserveNullAndEmptyArrays: true } },
      { $sort: { redeemedAt: -1 } },
    ])
    return rows.map((r) => ({
      _id: r._id.toString(),
      coachName: r.coach?.name ?? 'Unknown',
      coachEmail: r.coach?.email ?? '',
      discountApplied: r.discountApplied,
      redeemedAt: r.redeemedAt.toISOString(),
    }))
  }
}
