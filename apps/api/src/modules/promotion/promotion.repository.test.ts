import mongoose from 'mongoose'
import { Promotion, Redemption } from './promotion.model'
import { PromotionRepository, UserUpgradeRepository } from './promotion.repository'
import { User } from '../auth/auth.model'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const promoRepo = new PromotionRepository()
const userRepo = new UserUpgradeRepository()

const ADMIN_ID = new mongoose.Types.ObjectId().toString()
const COACH_ID = new mongoose.Types.ObjectId().toString()

const seedPromo = (overrides: Record<string, unknown> = {}) =>
  Promotion.create({
    code: 'TESTCODE',
    discountType: 'percentage',
    discountValue: 20,
    applicableTiers: ['pro'],
    currentRedemptions: 0,
    isActive: true,
    createdBy: ADMIN_ID,
    ...overrides,
  })

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await Promotion.deleteMany({})
  await Redemption.deleteMany({})
  await User.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await Promotion.deleteMany({})
  await Redemption.deleteMany({})
  await User.deleteMany({})
})

describe('PromotionRepository.findByCode', () => {
  it('returns null for an unknown code', async () => {
    expect(await promoRepo.findByCode('UNKNOWN')).toBeNull()
  })

  it('returns the promotion when code matches', async () => {
    await seedPromo({ code: 'LAUNCH50' })
    const result = await promoRepo.findByCode('LAUNCH50')
    expect(result?.code).toBe('LAUNCH50')
  })
})

describe('PromotionRepository.findAll', () => {
  it('returns empty array when no promotions exist', async () => {
    expect(await promoRepo.findAll()).toEqual([])
  })

  it('returns all promotions sorted by createdAt descending', async () => {
    await seedPromo({ code: 'FIRST', createdAt: new Date('2026-01-01') })
    await seedPromo({ code: 'SECOND', createdAt: new Date('2026-01-02') })
    const result = await promoRepo.findAll()
    expect(result).toHaveLength(2)
    expect(result[0].code).toBe('SECOND')
  })
})

describe('PromotionRepository.create', () => {
  it('creates a promotion with correct fields', async () => {
    const promo = await promoRepo.create({
      code: 'NEWCODE',
      discountType: 'fixed',
      discountValue: 500,
      applicableTiers: ['pro', 'team'],
      createdBy: ADMIN_ID,
    })
    expect(promo.code).toBe('NEWCODE')
    expect(promo.discountType).toBe('fixed')
    expect(promo.currentRedemptions).toBe(0)
    expect(promo.isActive).toBe(true)
  })
})

describe('PromotionRepository.update', () => {
  it('returns null for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    expect(await promoRepo.update(fakeId, { isActive: false })).toBeNull()
  })

  it('updates and returns the updated promotion', async () => {
    const promo = await seedPromo()
    const updated = await promoRepo.update(promo._id.toString(), { isActive: false })
    expect(updated?.isActive).toBe(false)
  })
})

describe('PromotionRepository.deactivate', () => {
  it('returns false for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    expect(await promoRepo.deactivate(fakeId)).toBe(false)
  })

  it('sets isActive to false and returns true', async () => {
    const promo = await seedPromo()
    const result = await promoRepo.deactivate(promo._id.toString())
    expect(result).toBe(true)
    const found = await Promotion.findById(promo._id)
    expect(found?.isActive).toBe(false)
  })
})

describe('PromotionRepository.createRedemption', () => {
  it('creates a redemption with correct fields', async () => {
    const promo = await seedPromo()
    const redemption = await promoRepo.createRedemption({
      promotionId: promo._id.toString(),
      coachId: COACH_ID,
      discountApplied: 20,
    })
    expect(redemption.coachId.toString()).toBe(COACH_ID)
    expect(redemption.discountApplied).toBe(20)
    expect(redemption.redeemedAt).toBeInstanceOf(Date)
  })
})

describe('PromotionRepository.hasCoachRedeemed', () => {
  it('returns false when coach has not redeemed the promotion', async () => {
    const promo = await seedPromo()
    expect(await promoRepo.hasCoachRedeemed(promo._id.toString(), COACH_ID)).toBe(false)
  })

  it('returns true when coach has already redeemed the promotion', async () => {
    const promo = await seedPromo()
    await promoRepo.createRedemption({
      promotionId: promo._id.toString(),
      coachId: COACH_ID,
      discountApplied: 20,
    })
    expect(await promoRepo.hasCoachRedeemed(promo._id.toString(), COACH_ID)).toBe(true)
  })
})

describe('PromotionRepository.incrementRedemptions', () => {
  it('increments currentRedemptions by 1', async () => {
    const promo = await seedPromo({ currentRedemptions: 2 })
    await promoRepo.incrementRedemptions(promo._id.toString())
    const found = await Promotion.findById(promo._id)
    expect(found?.currentRedemptions).toBe(3)
  })
})

describe('UserUpgradeRepository.upgradeTier', () => {
  it('sets subscriptionTier and subscriptionStatus to active on the user', async () => {
    const user = await User.create({
      name: 'Coach',
      email: 'coach@test.com',
      passwordHash: 'hash',
      subscriptionTier: 'starter',
      subscriptionStatus: 'active',
    })
    await userRepo.upgradeTier(user._id.toString(), 'pro')
    const updated = await User.findById(user._id)
    expect(updated?.subscriptionTier).toBe('pro')
    expect(updated?.subscriptionStatus).toBe('active')
  })
})
