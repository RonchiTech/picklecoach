import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

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

async function loginAndGetCookie(): Promise<string[]> {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Coach Ron', email: 'ron@test.com', password: 'password123' })
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'ron@test.com', password: 'password123' })
  return res.headers['set-cookie'] as unknown as string[]
}

describe('GET /api/v1/dashboard/stats', () => {
  it('returns 401 NOT_AUTHENTICATED without a token', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('NOT_AUTHENTICATED')
  })

  it('returns 200 with stats shape for authenticated coach', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app).get('/api/v1/dashboard/stats').set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.data.todaySessions).toBe('number')
    expect(typeof res.body.data.totalStudents).toBe('number')
    expect(typeof res.body.data.unpaidBalance).toBe('number')
  })

  it('returns zero counts when no sessions, students, or payments exist', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app).get('/api/v1/dashboard/stats').set('Cookie', cookie)

    expect(res.body.data).toEqual({
      todaySessions: 0,
      totalStudents: 0,
      unpaidBalance: 0,
    })
  })
})
