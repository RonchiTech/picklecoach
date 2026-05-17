import mongoose from 'mongoose'
import { User } from '../auth/auth.model'
import { SubscriptionRepository } from './subscription.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new SubscriptionRepository()

const seed = (overrides: Record<string, unknown> = {}) =>
  User.create({
    name: 'Coach Sub',
    email: 'sub@test.com',
    passwordHash: 'hash',
    role: 'coach',
    subscriptionTier: 'starter',
    subscriptionStatus: 'trial',
    trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    ...overrides,
  })

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
})

describe('SubscriptionRepository.findByUserId', () => {
  it('returns subscription fields for existing user', async () => {
    const user = await seed()
    const result = await repo.findByUserId(user._id.toString())
    expect(result).not.toBeNull()
    expect(result!.tier).toBe('starter')
    expect(result!.status).toBe('trial')
    expect(result!.trialEndsAt).toBeInstanceOf(Date)
  })

  it('returns null for unknown userId', async () => {
    const result = await repo.findByUserId(new mongoose.Types.ObjectId().toString())
    expect(result).toBeNull()
  })
})
