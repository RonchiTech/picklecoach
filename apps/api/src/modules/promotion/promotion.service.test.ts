import { PromotionService } from './promotion.service'
import type { IPromotionRepository, IUserUpgradeRepository } from './promotion.repository'
import type { IPromotion, IRedemption } from './promotion.model'
import mongoose from 'mongoose'

const COACH_ID = new mongoose.Types.ObjectId().toString()
const ADMIN_ID = new mongoose.Types.ObjectId().toString()
const PROMO_ID = new mongoose.Types.ObjectId().toString()

const mockPromo = {
  _id: { toString: () => PROMO_ID },
  code: 'LAUNCH50',
  discountType: 'percentage',
  discountValue: 50,
  applicableTiers: ['pro'],
  expiresAt: undefined,
  maxRedemptions: undefined,
  currentRedemptions: 0,
  isActive: true,
  createdBy: { toString: () => ADMIN_ID },
} as unknown as IPromotion

const mockRedemption = {
  promotionId: { toString: () => PROMO_ID },
  coachId: { toString: () => COACH_ID },
  discountApplied: 50,
  redeemedAt: new Date(),
} as unknown as IRedemption

const mockPromoRepo: jest.Mocked<IPromotionRepository> = {
  findByCode: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
  createRedemption: jest.fn(),
  hasCoachRedeemed: jest.fn(),
  incrementRedemptions: jest.fn(),
}

const mockUserRepo: jest.Mocked<IUserUpgradeRepository> = {
  upgradeTier: jest.fn(),
}

let service: PromotionService

beforeEach(() => {
  jest.clearAllMocks()
  service = new PromotionService(mockPromoRepo, mockUserRepo)
})

describe('PromotionService.apply', () => {
  it('throws PROMO_NOT_FOUND when code does not exist', async () => {
    mockPromoRepo.findByCode.mockResolvedValue(null)
    await expect(service.apply('BADCODE', COACH_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'PROMO_NOT_FOUND',
    })
  })

  it('throws PROMO_NOT_FOUND when promo is inactive', async () => {
    mockPromoRepo.findByCode.mockResolvedValue({
      ...mockPromo,
      isActive: false,
    } as unknown as IPromotion)
    await expect(service.apply('LAUNCH50', COACH_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'PROMO_NOT_FOUND',
    })
  })

  it('throws PROMO_EXPIRED when past expiresAt', async () => {
    const expired = {
      ...mockPromo,
      expiresAt: new Date(Date.now() - 1000),
    } as unknown as IPromotion
    mockPromoRepo.findByCode.mockResolvedValue(expired)
    await expect(service.apply('LAUNCH50', COACH_ID)).rejects.toMatchObject({
      statusCode: 400,
      code: 'PROMO_EXPIRED',
    })
  })

  it('throws PROMO_MAX_REACHED when currentRedemptions >= maxRedemptions', async () => {
    const maxed = {
      ...mockPromo,
      maxRedemptions: 10,
      currentRedemptions: 10,
    } as unknown as IPromotion
    mockPromoRepo.findByCode.mockResolvedValue(maxed)
    await expect(service.apply('LAUNCH50', COACH_ID)).rejects.toMatchObject({
      statusCode: 400,
      code: 'PROMO_MAX_REACHED',
    })
  })

  it('throws PROMO_ALREADY_REDEEMED when coach already used the code', async () => {
    mockPromoRepo.findByCode.mockResolvedValue(mockPromo)
    mockPromoRepo.hasCoachRedeemed.mockResolvedValue(true)
    await expect(service.apply('LAUNCH50', COACH_ID)).rejects.toMatchObject({
      statusCode: 409,
      code: 'PROMO_ALREADY_REDEEMED',
    })
  })

  it('creates redemption, increments counter, upgrades tier, and returns result', async () => {
    mockPromoRepo.findByCode.mockResolvedValue(mockPromo)
    mockPromoRepo.hasCoachRedeemed.mockResolvedValue(false)
    mockPromoRepo.createRedemption.mockResolvedValue(mockRedemption)
    mockPromoRepo.incrementRedemptions.mockResolvedValue()
    mockUserRepo.upgradeTier.mockResolvedValue()

    const result = await service.apply('LAUNCH50', COACH_ID)

    expect(mockPromoRepo.createRedemption).toHaveBeenCalledWith({
      promotionId: PROMO_ID,
      coachId: COACH_ID,
      discountApplied: 50,
    })
    expect(mockPromoRepo.incrementRedemptions).toHaveBeenCalledWith(PROMO_ID)
    expect(mockUserRepo.upgradeTier).toHaveBeenCalledWith(COACH_ID, 'pro')
    expect(result).toEqual({ tier: 'pro', discountApplied: 50 })
  })
})

describe('PromotionService.list', () => {
  it('returns all promotions from repo', async () => {
    mockPromoRepo.findAll.mockResolvedValue([mockPromo])
    const result = await service.list()
    expect(result).toHaveLength(1)
    expect(mockPromoRepo.findAll).toHaveBeenCalled()
  })
})

describe('PromotionService.create', () => {
  it('calls repo.create with normalized code and returns promotion', async () => {
    mockPromoRepo.create.mockResolvedValue(mockPromo)
    const result = await service.create(
      {
        code: 'LAUNCH50',
        discountType: 'percentage',
        discountValue: 50,
        applicableTiers: ['pro'],
      },
      ADMIN_ID
    )
    expect(mockPromoRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'LAUNCH50', createdBy: ADMIN_ID })
    )
    expect(result.code).toBe('LAUNCH50')
  })
})

describe('PromotionService.update', () => {
  it('throws PROMO_NOT_FOUND when promo does not exist', async () => {
    mockPromoRepo.update.mockResolvedValue(null)
    await expect(service.update(PROMO_ID, { isActive: false })).rejects.toMatchObject({
      statusCode: 404,
      code: 'PROMO_NOT_FOUND',
    })
  })

  it('returns the updated promotion', async () => {
    const updated = { ...mockPromo, isActive: false } as unknown as IPromotion
    mockPromoRepo.update.mockResolvedValue(updated)
    const result = await service.update(PROMO_ID, { isActive: false })
    expect(result.isActive).toBe(false)
  })
})

describe('PromotionService.deactivate', () => {
  it('throws PROMO_NOT_FOUND when promo does not exist', async () => {
    mockPromoRepo.deactivate.mockResolvedValue(false)
    await expect(service.deactivate(PROMO_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'PROMO_NOT_FOUND',
    })
  })

  it('resolves without error when deactivation succeeds', async () => {
    mockPromoRepo.deactivate.mockResolvedValue(true)
    await expect(service.deactivate(PROMO_ID)).resolves.toBeUndefined()
  })
})
