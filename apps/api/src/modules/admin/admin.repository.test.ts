import mongoose from 'mongoose'
import { User } from '../auth/auth.model'
import { UpgradeRequest } from '../upgrade-request/upgrade-request.model'
import { Student } from '../student/student.model'
import { Session } from '../session/session.model'
import { AdminRepository } from './admin.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new AdminRepository()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await UpgradeRequest.deleteMany({})
  await Student.deleteMany({})
  await Session.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
  await UpgradeRequest.deleteMany({})
  await Student.deleteMany({})
  await Session.deleteMany({})
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

describe('AdminRepository.getCoachDetail', () => {
  it('returns null for unknown coach id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    expect(await repo.getCoachDetail(fakeId)).toBeNull()
  })

  it('returns null when id belongs to super_admin', async () => {
    const admin = await seedCoach({ role: 'super_admin' })
    expect(await repo.getCoachDetail(admin._id.toString())).toBeNull()
  })

  it('returns coach with zero counts and empty history when no related data', async () => {
    const coach = await seedCoach({ name: 'Solo Coach' })
    const detail = await repo.getCoachDetail(coach._id.toString())
    expect(detail).not.toBeNull()
    expect(detail!.studentCount).toBe(0)
    expect(detail!.sessionCount).toBe(0)
    expect(detail!.lastSessionAt).toBeUndefined()
    expect(detail!.subscriptionHistory).toEqual([])
  })

  it('counts students and sessions belonging to this coach only', async () => {
    const coach = await seedCoach()
    const other = await seedCoach()
    await Student.create([
      { coachId: coach._id, name: 'A', skillLevel: 'beginner', isActive: true },
      { coachId: coach._id, name: 'B', skillLevel: 'beginner', isActive: true },
      { coachId: other._id, name: 'C', skillLevel: 'beginner', isActive: true },
    ])
    await Session.create([
      {
        coachId: coach._id,
        type: 'private',
        status: 'completed',
        scheduledAt: new Date(),
        durationMinutes: 60,
      },
      {
        coachId: other._id,
        type: 'private',
        status: 'completed',
        scheduledAt: new Date(),
        durationMinutes: 60,
      },
    ])
    const detail = await repo.getCoachDetail(coach._id.toString())
    expect(detail!.studentCount).toBe(2)
    expect(detail!.sessionCount).toBe(1)
  })

  it('returns subscription history sorted by reviewedAt ascending (oldest first)', async () => {
    const admin = await seedCoach({ role: 'super_admin' })
    const coach = await seedCoach({ subscriptionTier: 'pro' })
    await UpgradeRequest.create({
      coachId: coach._id,
      months: 3,
      amountDue: 399,
      discountApplied: 0,
      receiptUrl: 'http://x.com/a.jpg',
      status: 'approved',
      reviewedAt: new Date('2026-04-01'),
      reviewedBy: admin._id,
    })
    await UpgradeRequest.create({
      coachId: coach._id,
      months: 1,
      amountDue: 149,
      discountApplied: 0,
      receiptUrl: 'http://x.com/b.jpg',
      status: 'approved',
      reviewedAt: new Date('2026-01-01'),
      reviewedBy: admin._id,
    })
    const detail = await repo.getCoachDetail(coach._id.toString())
    expect(detail!.subscriptionHistory).toHaveLength(2)
    expect(detail!.subscriptionHistory[0].months).toBe(1)
    expect(detail!.subscriptionHistory[1].months).toBe(3)
  })

  it('excludes pending and rejected upgrade requests from subscription history', async () => {
    const coach = await seedCoach()
    await UpgradeRequest.create({
      coachId: coach._id,
      months: 1,
      amountDue: 149,
      discountApplied: 0,
      receiptUrl: 'http://x.com/p.jpg',
      status: 'pending',
    })
    const detail = await repo.getCoachDetail(coach._id.toString())
    expect(detail!.subscriptionHistory).toHaveLength(0)
  })
})

describe('AdminRepository.listExpiringCoaches', () => {
  it('returns empty array when no pro coaches exist', async () => {
    expect(await repo.listExpiringCoaches()).toEqual([])
  })

  it('returns pro coaches whose proEndsAt is within 14 days', async () => {
    const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await seedCoach({ name: 'Expiring', subscriptionTier: 'pro', proEndsAt: soon })
    const result = await repo.listExpiringCoaches()
    expect(result).toHaveLength(1)
    expect(result[0].daysLeft).toBeGreaterThanOrEqual(6)
    expect(result[0].daysLeft).toBeLessThanOrEqual(8)
    expect(result[0].proEndsAt).toBeDefined()
  })

  it('excludes coaches whose proEndsAt is more than 14 days away', async () => {
    const farFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await seedCoach({ subscriptionTier: 'pro', proEndsAt: farFuture })
    expect(await repo.listExpiringCoaches()).toEqual([])
  })

  it('excludes starter coaches', async () => {
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    await seedCoach({ subscriptionTier: 'starter', proEndsAt: soon })
    expect(await repo.listExpiringCoaches()).toEqual([])
  })

  it('sorts results by proEndsAt ascending (soonest first)', async () => {
    const day3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const day10 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    await seedCoach({ name: 'Later', subscriptionTier: 'pro', proEndsAt: day10 })
    await seedCoach({ name: 'Sooner', subscriptionTier: 'pro', proEndsAt: day3 })
    const result = await repo.listExpiringCoaches()
    expect(result[0].name).toBe('Sooner')
  })
})

describe('AdminRepository.listChurnedCoaches', () => {
  it('returns empty array when no coaches have churned', async () => {
    expect(await repo.listChurnedCoaches()).toEqual([])
  })

  it('returns starter coaches who previously had an approved upgrade request', async () => {
    const admin = await seedCoach({ role: 'super_admin' })
    const churned = await seedCoach({ name: 'Lapsed', subscriptionTier: 'starter' })
    await UpgradeRequest.create({
      coachId: churned._id,
      months: 1,
      amountDue: 149,
      discountApplied: 0,
      receiptUrl: 'http://x.com/c.jpg',
      status: 'approved',
      reviewedAt: new Date('2026-03-01'),
      reviewedBy: admin._id,
    })
    const result = await repo.listChurnedCoaches()
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe(churned._id.toString())
    expect(result[0].name).toBe('Lapsed')
    expect(result[0].lastApprovedAt).toBeDefined()
  })

  it('excludes current pro coaches even if they have approved upgrade requests', async () => {
    const admin = await seedCoach({ role: 'super_admin' })
    const active = await seedCoach({ subscriptionTier: 'pro' })
    await UpgradeRequest.create({
      coachId: active._id,
      months: 1,
      amountDue: 149,
      discountApplied: 0,
      receiptUrl: 'http://x.com/d.jpg',
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: admin._id,
    })
    expect(await repo.listChurnedCoaches()).toEqual([])
  })

  it('excludes starter coaches who have never had an approved upgrade request', async () => {
    await seedCoach({ subscriptionTier: 'starter' })
    expect(await repo.listChurnedCoaches()).toEqual([])
  })
})

describe('AdminRepository.listCoaches with filters', () => {
  it('returns only pro coaches when tier filter is "pro"', async () => {
    await seedCoach({ subscriptionTier: 'starter' })
    await seedCoach({ subscriptionTier: 'pro' })
    const result = await repo.listCoaches({ tier: 'pro' })
    expect(result).toHaveLength(1)
    expect(result[0].subscriptionTier).toBe('pro')
  })

  it('returns only expired coaches when status filter is "expired"', async () => {
    await seedCoach({ subscriptionStatus: 'active' })
    await seedCoach({ subscriptionStatus: 'expired' })
    const result = await repo.listCoaches({ status: 'expired' })
    expect(result).toHaveLength(1)
    expect(result[0].subscriptionStatus).toBe('expired')
  })

  it('returns all coaches when no filters are passed', async () => {
    await seedCoach({ subscriptionTier: 'starter' })
    await seedCoach({ subscriptionTier: 'pro' })
    expect(await repo.listCoaches()).toHaveLength(2)
  })
})
