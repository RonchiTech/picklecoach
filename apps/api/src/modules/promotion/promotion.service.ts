import type {
  CreatePromotionInput,
  PublicRedemption,
  UpdatePromotionInput,
  ValidatePromoResult,
} from '@picklecoach/shared'
import { BUNDLE_PRICES } from '@picklecoach/shared'
import type { IPromotionRepository } from './promotion.repository'
import type { IPromotion } from './promotion.model'
import { createError } from '../../middleware/error.middleware'

export class PromotionService {
  constructor(private promoRepo: IPromotionRepository) {}

  async validate(code: string, months: number): Promise<ValidatePromoResult> {
    const promo = await this.promoRepo.findByCode(code)
    if (!promo || !promo.isActive) throw createError('Promo code not found', 404, 'PROMO_NOT_FOUND')

    if (promo.expiresAt && new Date() > promo.expiresAt) {
      throw createError('This promo code has expired', 400, 'PROMO_EXPIRED')
    }

    if (promo.maxRedemptions != null && promo.currentRedemptions >= promo.maxRedemptions) {
      throw createError(
        'This promo code has reached its maximum redemptions',
        400,
        'PROMO_MAX_REACHED'
      )
    }

    const baseAmount = BUNDLE_PRICES[months] ?? 149
    let finalAmount: number
    if (promo.discountType === 'percentage') {
      finalAmount = Math.floor(baseAmount * (1 - promo.discountValue / 100))
    } else {
      finalAmount = Math.max(0, baseAmount - promo.discountValue)
    }

    return {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      baseAmount,
      finalAmount,
    }
  }

  async list(): Promise<IPromotion[]> {
    return this.promoRepo.findAll()
  }

  async create(input: CreatePromotionInput, createdBy: string): Promise<IPromotion> {
    return this.promoRepo.create({ ...input, createdBy })
  }

  async update(id: string, input: UpdatePromotionInput): Promise<IPromotion> {
    const promo = await this.promoRepo.update(id, input)
    if (!promo) throw createError('Promotion not found', 404, 'PROMO_NOT_FOUND')
    return promo
  }

  async deactivate(id: string): Promise<void> {
    const success = await this.promoRepo.deactivate(id)
    if (!success) throw createError('Promotion not found', 404, 'PROMO_NOT_FOUND')
  }

  async listRedemptions(promotionId: string): Promise<PublicRedemption[]> {
    return this.promoRepo.findRedemptionsByPromotion(promotionId)
  }
}
