import type {
  CreatePromotionInput,
  UpdatePromotionInput,
  SubscriptionTier,
  ApplyPromoResult,
} from '@picklecoach/shared'
import type { IPromotionRepository, IUserUpgradeRepository } from './promotion.repository'
import type { IPromotion } from './promotion.model'
import { createError } from '../../middleware/error.middleware'

export class PromotionService {
  constructor(
    private promoRepo: IPromotionRepository,
    private userRepo: IUserUpgradeRepository
  ) {}

  async apply(code: string, coachId: string): Promise<ApplyPromoResult> {
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

    const alreadyRedeemed = await this.promoRepo.hasCoachRedeemed(promo._id.toString(), coachId)
    if (alreadyRedeemed) {
      throw createError('You have already redeemed this promo code', 409, 'PROMO_ALREADY_REDEEMED')
    }

    await this.promoRepo.createRedemption({
      promotionId: promo._id.toString(),
      coachId,
      discountApplied: promo.discountValue,
    })
    await this.promoRepo.incrementRedemptions(promo._id.toString())

    const tier = promo.applicableTiers[0] as SubscriptionTier
    await this.userRepo.upgradeTier(coachId, tier)

    return { tier, discountApplied: promo.discountValue }
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
}
