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

async function registerAndLogin(email = 'coach@test.com') {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Coach', email, password: 'Password1!' })
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'Password1!' })
  return res.headers['set-cookie'] as unknown as string[]
}

async function createAdminAndLogin() {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Admin', email: 'admin@test.com', password: 'Password1!' })
  await User.updateOne({ email: 'admin@test.com' }, { role: 'super_admin' })
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'Password1!' })
  return res.headers['set-cookie'] as unknown as string[]
}

describe('GET /api/v1/admin/stats', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/admin/stats')
    expect(res.status).toBe(401)
  })

  it('returns 403 FORBIDDEN for coach role', async () => {
    const cookies = await registerAndLogin()
    const res = await request(app).get('/api/v1/admin/stats').set('Cookie', cookies)
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('returns stats for super_admin', async () => {
    const adminCookies = await createAdminAndLogin()
    await registerAndLogin('coach1@test.com')
    const res = await request(app).get('/api/v1/admin/stats').set('Cookie', adminCookies)
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({
      totalCoaches: 1,
      activeTrials: 1,
      activeSubscriptions: 0,
    })
  })
})

describe('GET /api/v1/admin/coaches', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/admin/coaches')
    expect(res.status).toBe(401)
  })

  it('returns 403 FORBIDDEN for coach role', async () => {
    const cookies = await registerAndLogin()
    const res = await request(app).get('/api/v1/admin/coaches').set('Cookie', cookies)
    expect(res.status).toBe(403)
  })

  it('returns list of coaches for super_admin', async () => {
    const adminCookies = await createAdminAndLogin()
    await registerAndLogin('coach1@test.com')
    await registerAndLogin('coach2@test.com')
    const res = await request(app).get('/api/v1/admin/coaches').set('Cookie', adminCookies)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.data[0]).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
      subscriptionTier: expect.any(String),
      subscriptionStatus: expect.any(String),
    })
  })
})

describe('PATCH /api/v1/admin/coaches/:id/subscription', () => {
  it('returns 401 without auth', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app)
      .patch(`/api/v1/admin/coaches/${fakeId}/subscription`)
      .send({ tier: 'pro' })
    expect(res.status).toBe(401)
  })

  it('returns 403 FORBIDDEN for coach role', async () => {
    const cookies = await registerAndLogin()
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app)
      .patch(`/api/v1/admin/coaches/${fakeId}/subscription`)
      .set('Cookie', cookies)
      .send({ tier: 'pro' })
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid tier', async () => {
    const adminCookies = await createAdminAndLogin()
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app)
      .patch(`/api/v1/admin/coaches/${fakeId}/subscription`)
      .set('Cookie', adminCookies)
      .send({ tier: 'invalid' })
    expect(res.status).toBe(400)
  })

  it('updates subscription tier and returns 200', async () => {
    const adminCookies = await createAdminAndLogin()
    await registerAndLogin('coachupgrade@test.com')
    const coach = await User.findOne({ email: 'coachupgrade@test.com' })
    const res = await request(app)
      .patch(`/api/v1/admin/coaches/${coach!._id}/subscription`)
      .set('Cookie', adminCookies)
      .send({ tier: 'pro' })
    expect(res.status).toBe(200)
    const updated = await User.findById(coach!._id)
    expect(updated?.subscriptionTier).toBe('pro')
    expect(updated?.subscriptionStatus).toBe('active')
  })
})
