import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'
import { Student } from './student.model'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
})

async function loginAndGetCookie(): Promise<string[]> {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Coach Ron', email: 'ron@test.com', password: 'password123' })
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'ron@test.com', password: 'password123' })
  return res.headers['set-cookie'] as unknown as string[]
}

describe('GET /api/v1/students', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/students')
    expect(res.status).toBe(401)
  })

  it('returns empty array when coach has no students', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app).get('/api/v1/students').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('POST /api/v1/students', () => {
  it('creates a student and returns 201', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookie)
      .send({ name: 'Jane Smith', skillLevel: 'intermediate', email: 'jane@test.com' })

    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('Jane Smith')
    expect(res.body.data.skillLevel).toBe('intermediate')
    expect(res.body.data.isActive).toBe(true)
  })

  it('returns 400 VALIDATION_ERROR for invalid input', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookie)
      .send({ name: 'X' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns created student in subsequent GET', async () => {
    const cookie = await loginAndGetCookie()
    await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookie)
      .send({ name: 'Jane Smith', skillLevel: 'beginner' })

    const res = await request(app).get('/api/v1/students').set('Cookie', cookie)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].name).toBe('Jane Smith')
  })
})

describe('GET /api/v1/students/:id', () => {
  it('returns 404 STUDENT_NOT_FOUND for unknown id', async () => {
    const cookie = await loginAndGetCookie()
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app).get(`/api/v1/students/${fakeId}`).set('Cookie', cookie)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('STUDENT_NOT_FOUND')
  })

  it('returns the student when found', async () => {
    const cookie = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookie)
      .send({ name: 'Jane', skillLevel: 'beginner' })

    const res = await request(app)
      .get(`/api/v1/students/${created.body.data._id}`)
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Jane')
  })
})

describe('PATCH /api/v1/students/:id', () => {
  it('updates and returns the student', async () => {
    const cookie = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookie)
      .send({ name: 'Jane', skillLevel: 'beginner' })

    const res = await request(app)
      .patch(`/api/v1/students/${created.body.data._id}`)
      .set('Cookie', cookie)
      .send({ skillLevel: 'advanced', notes: 'Great progress' })

    expect(res.status).toBe(200)
    expect(res.body.data.skillLevel).toBe('advanced')
    expect(res.body.data.notes).toBe('Great progress')
  })

  it('returns 404 for a student belonging to another coach', async () => {
    const cookieA = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookieA)
      .send({ name: 'Jane', skillLevel: 'beginner' })

    await User.deleteMany({})
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach B', email: 'b@test.com', password: 'password123' })
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'b@test.com', password: 'password123' })
    const cookieB = loginB.headers['set-cookie'] as unknown as string[]

    const res = await request(app)
      .patch(`/api/v1/students/${created.body.data._id}`)
      .set('Cookie', cookieB)
      .send({ name: 'Hacked' })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/v1/students/:id', () => {
  it('archives the student (sets isActive to false)', async () => {
    const cookie = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookie)
      .send({ name: 'Jane', skillLevel: 'beginner' })

    const res = await request(app)
      .delete(`/api/v1/students/${created.body.data._id}`)
      .set('Cookie', cookie)

    expect(res.status).toBe(200)

    const list = await request(app).get('/api/v1/students').set('Cookie', cookie)
    expect(list.body.data).toHaveLength(0)
  })
})
