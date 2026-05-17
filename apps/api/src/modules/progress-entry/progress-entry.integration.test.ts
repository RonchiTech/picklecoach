import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'
import { ProgressEntry } from './progress-entry.model'
import { Student } from '../student/student.model'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
  await ProgressEntry.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
  await ProgressEntry.deleteMany({})
})

async function registerAndLogin(email = 'coach@test.com') {
  await request(app).post('/api/v1/auth/register').send({
    name: 'Coach Test',
    email,
    password: 'Password1!',
  })
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'Password1!' })
  return loginRes.headers['set-cookie'] as unknown as string[]
}

async function createStudent(cookies: string[]) {
  const res = await request(app)
    .post('/api/v1/students')
    .set('Cookie', cookies)
    .send({ name: 'Test Student', skillLevel: 'beginner' })
  return res.body.data._id as string
}

describe('requireProOrTrial middleware', () => {
  it('allows access during trial (default for new users)', async () => {
    const cookies = await registerAndLogin('trial@test.com')
    const studentId = await createStudent(cookies)
    const res = await request(app)
      .get(`/api/v1/progress-entries?studentId=${studentId}`)
      .set('Cookie', cookies)
    expect(res.status).toBe(200)
  })

  it('blocks access with 403 TIER_REQUIRED when on active Starter plan', async () => {
    const cookies = await registerAndLogin('starter@test.com')
    await User.updateOne(
      { email: 'starter@test.com' },
      { subscriptionStatus: 'active', subscriptionTier: 'starter' }
    )
    const studentId = await createStudent(cookies)
    const res = await request(app)
      .get(`/api/v1/progress-entries?studentId=${studentId}`)
      .set('Cookie', cookies)
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('TIER_REQUIRED')
  })
})

describe('GET /api/v1/progress-entries', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/progress-entries?studentId=abc')
    expect(res.status).toBe(401)
  })

  it('returns 400 when studentId query param is missing', async () => {
    const cookies = await registerAndLogin()
    const res = await request(app).get('/api/v1/progress-entries').set('Cookie', cookies)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns empty array when no entries exist for student', async () => {
    const cookies = await registerAndLogin()
    const studentId = await createStudent(cookies)
    const res = await request(app)
      .get(`/api/v1/progress-entries?studentId=${studentId}`)
      .set('Cookie', cookies)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('POST /api/v1/progress-entries', () => {
  it('creates an entry and returns 201', async () => {
    const cookies = await registerAndLogin()
    const studentId = await createStudent(cookies)
    const res = await request(app)
      .post('/api/v1/progress-entries')
      .set('Cookie', cookies)
      .send({ studentId, type: 'goal', content: 'Work on dinking', skillTags: ['dinking'] })
    expect(res.status).toBe(201)
    expect(res.body.data.content).toBe('Work on dinking')
    expect(res.body.data.type).toBe('goal')
    expect(res.body.data.skillTags).toEqual(['dinking'])
  })

  it('returns 400 VALIDATION_ERROR for empty content', async () => {
    const cookies = await registerAndLogin()
    const studentId = await createStudent(cookies)
    const res = await request(app)
      .post('/api/v1/progress-entries')
      .set('Cookie', cookies)
      .send({ studentId, content: '' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('created entry appears in subsequent GET', async () => {
    const cookies = await registerAndLogin()
    const studentId = await createStudent(cookies)
    await request(app)
      .post('/api/v1/progress-entries')
      .set('Cookie', cookies)
      .send({ studentId, content: 'Great form', skillTags: [] })
    const res = await request(app)
      .get(`/api/v1/progress-entries?studentId=${studentId}`)
      .set('Cookie', cookies)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].content).toBe('Great form')
  })
})

describe('PATCH /api/v1/progress-entries/:id', () => {
  it('updates the entry content', async () => {
    const cookies = await registerAndLogin()
    const studentId = await createStudent(cookies)
    const created = await request(app)
      .post('/api/v1/progress-entries')
      .set('Cookie', cookies)
      .send({ studentId, content: 'Old content', skillTags: [] })

    const res = await request(app)
      .patch(`/api/v1/progress-entries/${created.body.data._id}`)
      .set('Cookie', cookies)
      .send({ content: 'Updated content' })
    expect(res.status).toBe(200)
    expect(res.body.data.content).toBe('Updated content')
  })

  it('returns 404 ENTRY_NOT_FOUND for unknown id', async () => {
    const cookies = await registerAndLogin()
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app)
      .patch(`/api/v1/progress-entries/${fakeId}`)
      .set('Cookie', cookies)
      .send({ content: 'Anything' })
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('ENTRY_NOT_FOUND')
  })
})

describe('DELETE /api/v1/progress-entries/:id', () => {
  it('deletes the entry and it no longer appears in GET', async () => {
    const cookies = await registerAndLogin()
    const studentId = await createStudent(cookies)
    const created = await request(app)
      .post('/api/v1/progress-entries')
      .set('Cookie', cookies)
      .send({ studentId, content: 'To delete', skillTags: [] })

    await request(app)
      .delete(`/api/v1/progress-entries/${created.body.data._id}`)
      .set('Cookie', cookies)
    const res = await request(app)
      .get(`/api/v1/progress-entries?studentId=${studentId}`)
      .set('Cookie', cookies)
    expect(res.body.data).toHaveLength(0)
  })

  it('returns 404 ENTRY_NOT_FOUND for unknown id', async () => {
    const cookies = await registerAndLogin()
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app)
      .delete(`/api/v1/progress-entries/${fakeId}`)
      .set('Cookie', cookies)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('ENTRY_NOT_FOUND')
  })
})
