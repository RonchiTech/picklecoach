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

async function registerAndLogin(email = 'sub@test.com') {
  await request(app).post('/api/v1/auth/register').send({
    name: 'Coach Sub',
    email,
    password: 'Password1!',
  })
  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email,
    password: 'Password1!',
  })
  return loginRes.headers['set-cookie'] as unknown as string[]
}

describe('GET /api/v1/subscriptions/me', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/subscriptions/me')
    expect(res.status).toBe(401)
  })

  it('returns subscription info for authenticated coach', async () => {
    const cookies = await registerAndLogin()
    const res = await request(app).get('/api/v1/subscriptions/me').set('Cookie', cookies)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.tier).toBe('starter')
    expect(res.body.data.status).toBe('trial')
    expect(res.body.data.daysRemaining).toBeGreaterThan(0)
    expect(res.body.data.isLocked).toBe(false)
    expect(typeof res.body.data.trialEndsAt).toBe('string')
    expect(typeof res.body.data.lockedAt).toBe('string')
  })
})
