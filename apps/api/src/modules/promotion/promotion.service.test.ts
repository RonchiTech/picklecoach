import { PromotionService } from './promotion.service'
import type { IPromotionRepository } from './promotion.repository'
import type { IPromotion } from './promotion.model'
import mongoose from 'mongoose'

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

const mockPromoRepo: jest.Mocked<IPromotionRepository> = {
  findByCode: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
  createRedemption: jest.fn(),
  hasCoachRedeemed: jest.fn(),
  incrementRedemptions: jest.fn(),
  findRedemptionsByPromotion: jest.fn(),
}

let service: PromotionService

beforeEach(() => {
  jest.clearAllMocks()
  service = new PromotionService(mockPromoRepo)
})

describe('PromotionService.validate', () => {
  it('throws PROMO_NOT_FOUND when code does not exist', async () => {
    mockPromoRepo.findByCode.mockResolvedValue(null)
    await expect(service.validate('BADCODE', 1)).rejects.toMatchObject({
      statusCode: 404,
      code: 'PROMO_NOT_FOUND',
    })
  })

  it('throws PROMO_NOT_FOUND when promo is inactive', async () => {
    mockPromoRepo.findByCode.mockResolvedValue({
      ...mockPromo,
      isActive: false,
    } as unknown as IPromotion)
    await expect(service.validate('LAUNCH50', 1)).rejects.toMatchObject({
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
    await expect(service.validate('LAUNCH50', 1)).rejects.toMatchObject({
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
    await expect(service.validate('LAUNCH50', 1)).rejects.toMatchObject({
      statusCode: 400,
      code: 'PROMO_MAX_REACHED',
    })
  })

  it('returns ValidatePromoResult with correct amount for percentage discount', async () => {
    mockPromoRepo.findByCode.mockResolvedValue(mockPromo)
    const result = await service.validate('LAUNCH50', 3)
    // 3 months = 399, 50% off = 199
    expect(result.baseAmount).toBe(399)
    expect(result.finalAmount).toBe(199)
    expect(result.discountType).toBe('percentage')
  })

  it('returns ValidatePromoResult with correct amount for fixed discount', async () => {
    const fixedPromo = {
      ...mockPromo,
      discountType: 'fixed',
      discountValue: 50,
    } as unknown as IPromotion
    mockPromoRepo.findByCode.mockResolvedValue(fixedPromo)
    const result = await service.validate('LAUNCH50', 1)
    // 1 month = 149, fixed 50 off = 99
    expect(result.baseAmount).toBe(149)
    expect(result.finalAmount).toBe(99)
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
      { code: 'LAUNCH50', discountType: 'percentage', discountValue: 50, applicableTiers: ['pro'] },
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
