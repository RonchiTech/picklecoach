import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'
import { Student } from '../student/student.model'
import { Session } from './session.model'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
  await Session.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
  await Session.deleteMany({})
})

async function loginAndGetCookie(): Promise<{ cookie: string[]; studentId: string }> {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Coach Ron', email: 'ron@test.com', password: 'password123' })
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'ron@test.com', password: 'password123' })
  const cookie = login.headers['set-cookie'] as unknown as string[]

  const studentRes = await request(app)
    .post('/api/v1/students')
    .set('Cookie', cookie)
    .send({ name: 'Jane Smith', skillLevel: 'beginner' })

  return { cookie, studentId: studentRes.body.data._id }
}

describe('GET /api/v1/sessions', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/sessions')
    expect(res.status).toBe(401)
  })

  it('returns empty array when coach has no sessions', async () => {
    const { cookie } = await loginAndGetCookie()
    const res = await request(app).get('/api/v1/sessions').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('POST /api/v1/sessions', () => {
  it('creates a session and returns 201', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookie)
      .send({
        studentIds: [studentId],
        type: 'private',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 60,
      })

    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('private')
    expect(res.body.data.status).toBe('scheduled')
    expect(res.body.data.durationMinutes).toBe(60)
    expect(res.body.data.studentIds).toContain(studentId)
  })

  it('returns 400 VALIDATION_ERROR when studentIds is empty', async () => {
    const { cookie } = await loginAndGetCookie()
    const res = await request(app).post('/api/v1/sessions').set('Cookie', cookie).send({
      studentIds: [],
      type: 'private',
      scheduledAt: new Date().toISOString(),
      durationMinutes: 60,
    })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 VALIDATION_ERROR for invalid scheduledAt', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookie)
      .send({
        studentIds: [studentId],
        type: 'private',
        scheduledAt: 'not-a-date',
        durationMinutes: 60,
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('appears in the session list after creation', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookie)
      .send({
        studentIds: [studentId],
        type: 'group',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 90,
      })

    const res = await request(app).get('/api/v1/sessions').set('Cookie', cookie)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].type).toBe('group')
  })
})

describe('GET /api/v1/sessions/:id', () => {
  it('returns 404 SESSION_NOT_FOUND for unknown id', async () => {
    const { cookie } = await loginAndGetCookie()
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app).get(`/api/v1/sessions/${fakeId}`).set('Cookie', cookie)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('SESSION_NOT_FOUND')
  })

  it('returns the session when found', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookie)
      .send({
        studentIds: [studentId],
        type: 'private',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 60,
      })

    const res = await request(app)
      .get(`/api/v1/sessions/${created.body.data._id}`)
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.data._id).toBe(created.body.data._id)
  })
})

describe('PATCH /api/v1/sessions/:id', () => {
  it('marks a session as completed', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookie)
      .send({
        studentIds: [studentId],
        type: 'private',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 60,
      })

    const res = await request(app)
      .patch(`/api/v1/sessions/${created.body.data._id}`)
      .set('Cookie', cookie)
      .send({ status: 'completed', notes: 'Great session' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('completed')
    expect(res.body.data.notes).toBe('Great session')
  })

  it('returns 404 for a session belonging to another coach', async () => {
    const { cookie: cookieA, studentId } = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookieA)
      .send({
        studentIds: [studentId],
        type: 'private',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 60,
      })

    await User.deleteMany({})
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach B', email: 'b@test.com', password: 'password123' })
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'b@test.com', password: 'password123' })
    const cookieB = loginB.headers['set-cookie'] as unknown as string[]

    const res = await request(app)
      .patch(`/api/v1/sessions/${created.body.data._id}`)
      .set('Cookie', cookieB)
      .send({ status: 'completed' })

    expect(res.status).toBe(404)
  })
})
