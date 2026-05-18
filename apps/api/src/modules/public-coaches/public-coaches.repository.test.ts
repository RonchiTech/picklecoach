import mongoose from 'mongoose'
import { CoachProfile } from '../coach-profile/coach-profile.model'
import { User } from '../auth/auth.model'
import { PublicCoachesRepository } from './public-coaches.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new PublicCoachesRepository()

const seedUser = (tier: 'starter' | 'pro' | 'team' = 'starter') =>
  User.create({
    name: 'Test User',
    email: `test-${Math.random().toString(36).slice(2, 8)}@test.com`,
    passwordHash: 'hashed',
    subscriptionTier: tier,
  })

const seedProfile = (
  userId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(),
  overrides: Record<string, unknown> = {}
) =>
  CoachProfile.create({
    coachId: userId,
    slug: `coach-${Math.random().toString(36).slice(2, 8)}`,
    displayName: 'Coach Ron',
    isPublic: true,
    specializations: [],
    sessionTypes: [],
    showContactInfo: false,
    totalViews: 0,
    ...overrides,
  })

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await CoachProfile.deleteMany({})
  await User.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await CoachProfile.deleteMany({})
  await User.deleteMany({})
})

describe('PublicCoachesRepository.findAll', () => {
  it('returns only isPublic: true profiles', async () => {
    await seedProfile(undefined, { isPublic: true })
    await seedProfile(undefined, { isPublic: false })
    const { coaches, total } = await repo.findAll({ filters: {}, page: 1, limit: 12 })
    expect(coaches).toHaveLength(1)
    expect(total).toBe(1)
  })

  it('filters by specialization', async () => {
    await seedProfile(undefined, { specializations: ['dinking'] })
    await seedProfile(undefined, { specializations: ['serve'] })
    const { coaches } = await repo.findAll({
      filters: { specialization: 'dinking' },
      page: 1,
      limit: 12,
    })
    expect(coaches).toHaveLength(1)
    expect(coaches[0].specializations).toContain('dinking')
  })

  it('filters by city case-insensitively', async () => {
    await seedProfile(undefined, { city: 'Manila' })
    await seedProfile(undefined, { city: 'Cebu' })
    const { coaches } = await repo.findAll({
      filters: { city: 'manila' },
      page: 1,
      limit: 12,
    })
    expect(coaches).toHaveLength(1)
    expect(coaches[0].city).toBe('Manila')
  })

  it('filters by sessionType', async () => {
    await seedProfile(undefined, { sessionTypes: ['private'] })
    await seedProfile(undefined, { sessionTypes: ['group'] })
    const { coaches } = await repo.findAll({
      filters: { sessionType: 'private' },
      page: 1,
      limit: 12,
    })
    expect(coaches).toHaveLength(1)
  })

  it('combines multiple filters', async () => {
    await seedProfile(undefined, { specializations: ['dinking'], city: 'Manila' })
    await seedProfile(undefined, { specializations: ['dinking'], city: 'Cebu' })
    const { coaches } = await repo.findAll({
      filters: { specialization: 'dinking', city: 'Manila' },
      page: 1,
      limit: 12,
    })
    expect(coaches).toHaveLength(1)
    expect(coaches[0].city).toBe('Manila')
  })

  it('paginates and returns the correct total', async () => {
    await Promise.all(
      Array.from({ length: 15 }, (_, i) => seedProfile(undefined, { totalViews: i }))
    )
    const page1 = await repo.findAll({ filters: {}, page: 1, limit: 12 })
    expect(page1.coaches).toHaveLength(12)
    expect(page1.total).toBe(15)
    const page2 = await repo.findAll({ filters: {}, page: 2, limit: 12 })
    expect(page2.coaches).toHaveLength(3)
  })

  it('includes subscriptionTier from linked user', async () => {
    const user = await seedUser('pro')
    await seedProfile(user._id)
    const { coaches } = await repo.findAll({ filters: {}, page: 1, limit: 12 })
    expect(coaches[0].subscriptionTier).toBe('pro')
  })

  it('defaults to starter when user is not found', async () => {
    await CoachProfile.create({
      coachId: new mongoose.Types.ObjectId(),
      slug: `orphan-${Math.random().toString(36).slice(2, 8)}`,
      displayName: 'Orphan Coach',
      isPublic: true,
      specializations: [],
      sessionTypes: [],
      showContactInfo: false,
      totalViews: 0,
    })
    const { coaches } = await repo.findAll({ filters: {}, page: 1, limit: 12 })
    expect(coaches[0].subscriptionTier).toBe('starter')
  })

  it('sorts Pro coaches before Starter coaches', async () => {
    const starterUser = await seedUser('starter')
    const proUser = await seedUser('pro')
    await seedProfile(starterUser._id, { displayName: 'Starter Coach', totalViews: 100 })
    await seedProfile(proUser._id, { displayName: 'Pro Coach', totalViews: 0 })
    const { coaches } = await repo.findAll({ filters: {}, page: 1, limit: 12 })
    expect(coaches[0].displayName).toBe('Pro Coach')
    expect(coaches[1].displayName).toBe('Starter Coach')
  })
})

describe('PublicCoachesRepository.findBySlug', () => {
  it('returns null for a non-existent slug', async () => {
    const result = await repo.findBySlug('does-not-exist')
    expect(result).toBeNull()
  })

  it('returns null for a private profile', async () => {
    await seedProfile(undefined, { slug: 'private-coach-a1b2', isPublic: false })
    const result = await repo.findBySlug('private-coach-a1b2')
    expect(result).toBeNull()
  })

  it('returns the profile when slug matches and isPublic is true', async () => {
    await seedProfile(undefined, { slug: 'coach-ron-a1b2' })
    const result = await repo.findBySlug('coach-ron-a1b2')
    expect(result?.displayName).toBe('Coach Ron')
  })

  it('includes subscriptionTier from linked user', async () => {
    const user = await seedUser('pro')
    await seedProfile(user._id, { slug: 'pro-coach-slug' })
    const result = await repo.findBySlug('pro-coach-slug')
    expect(result?.subscriptionTier).toBe('pro')
  })
})

describe('PublicCoachesRepository.incrementViews', () => {
  it('atomically increments totalViews by 1', async () => {
    await seedProfile(undefined, { slug: 'view-coach-x1y2', totalViews: 5 })
    await repo.incrementViews('view-coach-x1y2')
    const updated = await CoachProfile.findOne({ slug: 'view-coach-x1y2' })
    expect(updated?.totalViews).toBe(6)
  })

  it('does not throw when slug does not exist', async () => {
    await expect(repo.incrementViews('ghost-slug')).resolves.not.toThrow()
  })
})

describe('PublicCoachesRepository.findAllPublicSlugs', () => {
  it('returns empty array when no public profiles exist', async () => {
    expect(await repo.findAllPublicSlugs()).toEqual([])
  })

  it('returns only slugs of public profiles', async () => {
    await seedProfile(undefined, { slug: 'alice-ph', isPublic: true })
    await seedProfile(undefined, { slug: 'bob-ph', isPublic: false })
    const slugs = await repo.findAllPublicSlugs()
    expect(slugs).toEqual(['alice-ph'])
  })

  it('returns all slugs when multiple public profiles exist', async () => {
    await seedProfile(undefined, { slug: 'coach-one', isPublic: true })
    await seedProfile(undefined, { slug: 'coach-two', isPublic: true })
    const slugs = await repo.findAllPublicSlugs()
    expect(slugs).toHaveLength(2)
    expect(slugs).toContain('coach-one')
    expect(slugs).toContain('coach-two')
  })
})
