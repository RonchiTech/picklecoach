import mongoose from 'mongoose'
import { CoachProfile } from '../coach-profile/coach-profile.model'
import { PublicCoachesRepository } from './public-coaches.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new PublicCoachesRepository()

const seed = (overrides: Record<string, unknown> = {}) =>
  CoachProfile.create({
    coachId: new mongoose.Types.ObjectId(),
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
  await mongoose.disconnect()
})
beforeEach(async () => {
  await CoachProfile.deleteMany({})
})

describe('PublicCoachesRepository.findAll', () => {
  it('returns only isPublic: true profiles', async () => {
    await seed({ isPublic: true })
    await seed({ isPublic: false })
    const { coaches, total } = await repo.findAll({ filters: {}, page: 1, limit: 12 })
    expect(coaches).toHaveLength(1)
    expect(total).toBe(1)
  })

  it('filters by specialization', async () => {
    await seed({ specializations: ['dinking'] })
    await seed({ specializations: ['serve'] })
    const { coaches } = await repo.findAll({
      filters: { specialization: 'dinking' },
      page: 1,
      limit: 12,
    })
    expect(coaches).toHaveLength(1)
    expect(coaches[0].specializations).toContain('dinking')
  })

  it('filters by city case-insensitively', async () => {
    await seed({ city: 'Manila' })
    await seed({ city: 'Cebu' })
    const { coaches } = await repo.findAll({
      filters: { city: 'manila' },
      page: 1,
      limit: 12,
    })
    expect(coaches).toHaveLength(1)
    expect(coaches[0].city).toBe('Manila')
  })

  it('filters by sessionType', async () => {
    await seed({ sessionTypes: ['private'] })
    await seed({ sessionTypes: ['group'] })
    const { coaches } = await repo.findAll({
      filters: { sessionType: 'private' },
      page: 1,
      limit: 12,
    })
    expect(coaches).toHaveLength(1)
  })

  it('combines multiple filters', async () => {
    await seed({ specializations: ['dinking'], city: 'Manila' })
    await seed({ specializations: ['dinking'], city: 'Cebu' })
    const { coaches } = await repo.findAll({
      filters: { specialization: 'dinking', city: 'Manila' },
      page: 1,
      limit: 12,
    })
    expect(coaches).toHaveLength(1)
    expect(coaches[0].city).toBe('Manila')
  })

  it('paginates and returns the correct total', async () => {
    await Promise.all(Array.from({ length: 15 }, (_, i) => seed({ totalViews: i })))
    const page1 = await repo.findAll({ filters: {}, page: 1, limit: 12 })
    expect(page1.coaches).toHaveLength(12)
    expect(page1.total).toBe(15)
    const page2 = await repo.findAll({ filters: {}, page: 2, limit: 12 })
    expect(page2.coaches).toHaveLength(3)
  })
})

describe('PublicCoachesRepository.findBySlug', () => {
  it('returns null for a non-existent slug', async () => {
    const result = await repo.findBySlug('does-not-exist')
    expect(result).toBeNull()
  })

  it('returns null for a private profile', async () => {
    await CoachProfile.create({
      coachId: new mongoose.Types.ObjectId(),
      slug: 'private-coach-a1b2',
      displayName: 'Private Coach',
      isPublic: false,
      specializations: [],
      sessionTypes: [],
      showContactInfo: false,
      totalViews: 0,
    })
    const result = await repo.findBySlug('private-coach-a1b2')
    expect(result).toBeNull()
  })

  it('returns the profile when slug matches and isPublic is true', async () => {
    await seed({ slug: 'coach-ron-a1b2' })
    const result = await repo.findBySlug('coach-ron-a1b2')
    expect(result?.displayName).toBe('Coach Ron')
  })
})

describe('PublicCoachesRepository.incrementViews', () => {
  it('atomically increments totalViews by 1', async () => {
    await seed({ slug: 'view-coach-x1y2', totalViews: 5 })
    await repo.incrementViews('view-coach-x1y2')
    const updated = await CoachProfile.findOne({ slug: 'view-coach-x1y2' })
    expect(updated?.totalViews).toBe(6)
  })

  it('does not throw when slug does not exist', async () => {
    await expect(repo.incrementViews('ghost-slug')).resolves.not.toThrow()
  })
})
