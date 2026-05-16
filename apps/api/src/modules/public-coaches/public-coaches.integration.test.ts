import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { CoachProfile } from '../coach-profile/coach-profile.model'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

const seedPublic = (overrides: Record<string, unknown> = {}) =>
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

describe('GET /api/v1/coaches', () => {
  it('returns paginated results with the correct shape', async () => {
    await seedPublic()
    const res = await request(app).get('/api/v1/coaches')
    expect(res.status).toBe(200)
    expect(res.body.data.coaches).toHaveLength(1)
    expect(res.body.data.total).toBe(1)
    expect(res.body.data.page).toBe(1)
    expect(res.body.data.totalPages).toBe(1)
  })

  it('excludes private profiles', async () => {
    await seedPublic()
    await CoachProfile.create({
      coachId: new mongoose.Types.ObjectId(),
      slug: 'private-coach-x9z1',
      displayName: 'Hidden Coach',
      isPublic: false,
      specializations: [],
      sessionTypes: [],
      showContactInfo: false,
      totalViews: 0,
    })
    const res = await request(app).get('/api/v1/coaches')
    expect(res.body.data.coaches).toHaveLength(1)
    expect(res.body.data.total).toBe(1)
  })

  it('filters by specialization', async () => {
    await seedPublic({ specializations: ['dinking'] })
    await seedPublic({ specializations: ['serve'] })
    const res = await request(app).get('/api/v1/coaches?specialization=dinking')
    expect(res.status).toBe(200)
    expect(res.body.data.coaches).toHaveLength(1)
    expect(res.body.data.coaches[0].specializations).toContain('dinking')
  })

  it('filters by city case-insensitively', async () => {
    await seedPublic({ city: 'Manila' })
    await seedPublic({ city: 'Cebu' })
    const res = await request(app).get('/api/v1/coaches?city=manila')
    expect(res.status).toBe(200)
    expect(res.body.data.coaches).toHaveLength(1)
  })

  it('filters by sessionType', async () => {
    await seedPublic({ sessionTypes: ['private'] })
    await seedPublic({ sessionTypes: ['group'] })
    const res = await request(app).get('/api/v1/coaches?sessionType=private')
    expect(res.status).toBe(200)
    expect(res.body.data.coaches).toHaveLength(1)
  })

  it('paginates with page param', async () => {
    await Promise.all(Array.from({ length: 15 }, () => seedPublic()))
    const res = await request(app).get('/api/v1/coaches?page=2')
    expect(res.status).toBe(200)
    expect(res.body.data.coaches).toHaveLength(3)
    expect(res.body.data.page).toBe(2)
    expect(res.body.data.total).toBe(15)
  })
})

describe('GET /api/v1/coaches/:slug', () => {
  it('returns 404 with COACH_NOT_FOUND for unknown slug', async () => {
    const res = await request(app).get('/api/v1/coaches/no-such-slug')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('COACH_NOT_FOUND')
  })

  it('returns 404 for a private profile', async () => {
    await CoachProfile.create({
      coachId: new mongoose.Types.ObjectId(),
      slug: 'private-slug-a1b2',
      displayName: 'Hidden',
      isPublic: false,
      specializations: [],
      sessionTypes: [],
      showContactInfo: false,
      totalViews: 0,
    })
    const res = await request(app).get('/api/v1/coaches/private-slug-a1b2')
    expect(res.status).toBe(404)
  })

  it('returns the profile and increments totalViews', async () => {
    await seedPublic({ slug: 'coach-ron-a1b2', totalViews: 3 })
    const res = await request(app).get('/api/v1/coaches/coach-ron-a1b2')
    expect(res.status).toBe(200)
    expect(res.body.data.displayName).toBe('Coach Ron')
    const updated = await CoachProfile.findOne({ slug: 'coach-ron-a1b2' })
    expect(updated?.totalViews).toBe(4)
  })

  it('increments totalViews on each successive call', async () => {
    await seedPublic({ slug: 'coach-ron-b2c3', totalViews: 0 })
    await request(app).get('/api/v1/coaches/coach-ron-b2c3')
    await request(app).get('/api/v1/coaches/coach-ron-b2c3')
    const updated = await CoachProfile.findOne({ slug: 'coach-ron-b2c3' })
    expect(updated?.totalViews).toBe(2)
  })
})
