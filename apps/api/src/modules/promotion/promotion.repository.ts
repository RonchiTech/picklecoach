import type { UpdatePromotionInput } from '@picklecoach/shared'
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
}
