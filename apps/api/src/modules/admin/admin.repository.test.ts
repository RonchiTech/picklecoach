import mongoose from 'mongoose'
import { User } from '../auth/auth.model'
import { UpgradeRequest } from '../upgrade-request/upgrade-request.model'
import { AdminRepository } from './admin.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new AdminRepository()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await UpgradeRequest.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
  await UpgradeRequest.deleteMany({})
})

const seedCoach = (overrides: Record<string, unknown> = {}) =>
  User.create({
    name: 'Coach',
    email: `coach-${Date.now()}-${Math.random()}@test.com`,
    passwordHash: 'hash',
    role: 'coach',
    subscriptionTier: 'starter',
    subscriptionStatus: 'active',
    ...overrides,
  })

describe('AdminRepository.getStats', () => {
  it('returns zero counts when no coaches exist', async () => {
    const stats = await repo.getStats()
    expect(stats.totalCoaches).toBe(0)
    expect(stats.activeTrials).toBe(0)
    expect(stats.activeSubscriptions).toBe(0)
  })

  it('counts coaches by tier correctly', async () => {
    await seedCoach({ subscriptionTier: 'starter' })
    await seedCoach({ subscriptionTier: 'starter' })
    await seedCoach({ subscriptionTier: 'pro' })
    const stats = await repo.getStats()
    expect(stats.totalCoaches).toBe(3)
    expect(stats.activeTrials).toBe(0)
    expect(stats.activeSubscriptions).toBe(1)
  })

  it('excludes super_admin from coach counts', async () => {
    await seedCoach({ role: 'super_admin', subscriptionStatus: 'active' })
    const stats = await repo.getStats()
    expect(stats.totalCoaches).toBe(0)
  })
})

describe('AdminRepository.listCoaches', () => {
  it('returns empty array when no coaches exist', async () => {
    expect(await repo.listCoaches()).toEqual([])
  })

  it('returns coaches sorted by createdAt descending', async () => {
    await seedCoach({ name: 'Alice', createdAt: new Date('2026-01-01') })
    await seedCoach({ name: 'Bob', createdAt: new Date('2026-01-02') })
    const result = await repo.listCoaches()
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Bob')
  })

  it('excludes super_admin users from the list', async () => {
    await seedCoach({ role: 'super_admin' })
    await seedCoach({ name: 'OnlyCoach' })
    const result = await repo.listCoaches()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('OnlyCoach')
  })

  it('returns correct fields on each coach', async () => {
    await seedCoach({ name: 'Test Coach', subscriptionTier: 'pro', subscriptionStatus: 'active' })
    const result = await repo.listCoaches()
    expect(result[0]).toMatchObject({
      name: 'Test Coach',
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
    })
    expect(result[0]._id).toBeDefined()
    expect(result[0].email).toBeDefined()
    expect(result[0].createdAt).toBeDefined()
  })
})

describe('AdminRepository.updateCoachSubscription', () => {
  it('updates subscriptionTier and sets subscriptionStatus to active', async () => {
    const coach = await seedCoach({ subscriptionTier: 'starter', subscriptionStatus: 'active' })
    await repo.updateCoachSubscription(coach._id.toString(), 'pro')
    const updated = await User.findById(coach._id)
    expect(updated?.subscriptionTier).toBe('pro')
    expect(updated?.subscriptionStatus).toBe('active')
  })

  it('does nothing and does not throw for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    await expect(repo.updateCoachSubscription(fakeId, 'pro')).resolves.not.toThrow()
  })
})

describe('AdminRepository.getRevenueSummary', () => {
  it('returns empty array when no approved upgrade requests exist', async () => {
    const result = await repo.getRevenueSummary()
    expect(result).toEqual([])
  })

  it('returns monthly revenue for approved upgrade requests', async () => {
    const coach = await seedCoach({ subscriptionTier: 'pro' })
    const reviewedAt = new Date('2026-05-01')
    await UpgradeRequest.create({
      coachId: coach._id,
      months: 3,
      amountDue: 399,
      discountApplied: 0,
      receiptUrl: 'https://example.com/r.jpg',
      status: 'approved',
      reviewedAt,
      reviewedBy: coach._id,
    })
    const result = await repo.getRevenueSummary()
    expect(result).toHaveLength(1)
    expect(result[0].month).toBe('2026-05')
    expect(result[0].revenue).toBe(399)
    expect(result[0].count).toBe(1)
  })

  it('excludes pending and rejected requests from revenue', async () => {
    const coach = await seedCoach()
    await UpgradeRequest.create({
      coachId: coach._id,
      months: 1,
      amountDue: 149,
      discountApplied: 0,
      receiptUrl: 'https://example.com/r.jpg',
      status: 'pending',
    })
    const result = await repo.getRevenueSummary()
    expect(result).toEqual([])
  })
})
