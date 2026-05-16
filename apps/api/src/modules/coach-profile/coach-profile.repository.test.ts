import mongoose from 'mongoose'
import { CoachProfile } from './coach-profile.model'
import { CoachProfileRepository } from './coach-profile.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new CoachProfileRepository()

const COACH_A = new mongoose.Types.ObjectId().toString()
const COACH_B = new mongoose.Types.ObjectId().toString()

const seed = (overrides: Record<string, unknown> = {}) =>
  CoachProfile.create({
    coachId: COACH_A,
    slug: 'coach-ron-a1b2',
    displayName: 'Coach Ron',
    isPublic: false,
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

describe('CoachProfileRepository.create', () => {
  it('creates a profile with the given coachId and slug', async () => {
    const profile = await repo.create({
      coachId: COACH_A,
      slug: 'coach-ron-a1b2',
      displayName: 'Coach Ron',
    })
    expect(profile.coachId.toString()).toBe(COACH_A)
    expect(profile.slug).toBe('coach-ron-a1b2')
    expect(profile.isPublic).toBe(false)
    expect(profile.totalViews).toBe(0)
  })
})

describe('CoachProfileRepository.findByCoachId', () => {
  it('returns null when no profile exists', async () => {
    const result = await repo.findByCoachId(COACH_A)
    expect(result).toBeNull()
  })

  it('returns the profile for the given coachId', async () => {
    await seed()
    const result = await repo.findByCoachId(COACH_A)
    expect(result?.displayName).toBe('Coach Ron')
  })

  it('returns null for a different coachId', async () => {
    await seed()
    const result = await repo.findByCoachId(COACH_B)
    expect(result).toBeNull()
  })
})

describe('CoachProfileRepository.findBySlug', () => {
  it('returns null when slug does not exist', async () => {
    const result = await repo.findBySlug('nonexistent-slug')
    expect(result).toBeNull()
  })

  it('returns the profile when slug matches', async () => {
    await seed()
    const result = await repo.findBySlug('coach-ron-a1b2')
    expect(result?.coachId.toString()).toBe(COACH_A)
  })
})

describe('CoachProfileRepository.update', () => {
  it('returns null when profile does not exist', async () => {
    const result = await repo.update(COACH_A, { displayName: 'New Name' })
    expect(result).toBeNull()
  })

  it('updates fields and returns the updated profile', async () => {
    await seed()
    const result = await repo.update(COACH_A, {
      displayName: 'Updated',
      city: 'Makati',
      isPublic: true,
    })
    expect(result?.displayName).toBe('Updated')
    expect(result?.city).toBe('Makati')
    expect(result?.isPublic).toBe(true)
  })
})

describe('CoachProfileRepository.updatePhoto', () => {
  it('returns null when profile does not exist', async () => {
    const result = await repo.updatePhoto(COACH_A, 'https://example.com/photo.jpg')
    expect(result).toBeNull()
  })

  it('sets photoUrl and returns the updated profile', async () => {
    await seed()
    const result = await repo.updatePhoto(COACH_A, 'https://res.cloudinary.com/test/image.jpg')
    expect(result?.photoUrl).toBe('https://res.cloudinary.com/test/image.jpg')
  })
})
