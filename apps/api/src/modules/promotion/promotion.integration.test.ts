import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'
import { Promotion, Redemption } from './promotion.model'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await Promotion.deleteMany({})
  await Redemption.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
  await Promotion.deleteMany({})
  await Redemption.deleteMany({})
})

async function registerAndLogin(email = 'coach@test.com') {
  await request(app).post('/api/v1/auth/register').send({
    name: 'Coach',
    email,
    password: 'Password1!',
  })
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'Password1!' })
  return loginRes.headers['set-cookie'] as unknown as string[]
}

async function createAdminAndLogin() {
  await request(app).post('/api/v1/auth/register').send({
    name: 'Admin',
    email: 'admin@test.com',
    password: 'Password1!',
  })
  await User.updateOne({ email: 'admin@test.com' }, { role: 'super_admin' })
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'Password1!' })
  return loginRes.headers['set-cookie'] as unknown as string[]
}

async function seedPromo(overrides: Record<string, unknown> = {}) {
  const adminId = new mongoose.Types.ObjectId()
  return Promotion.create({
    code: 'TESTCODE',
    discountType: 'percentage',
    discountValue: 20,
    applicableTiers: ['pro'],
    currentRedemptions: 0,
    isActive: true,
    createdBy: adminId,
    ...overrides,
  })
}

describe('POST /api/v1/promotions/validate', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/promotions/validate')
      .send({ code: 'TEST', months: 1 })
    expect(res.status).toBe(401)
  })

  it('returns 404 PROMO_NOT_FOUND for unknown code', async () => {
    const cookies = await registerAndLogin()
    const res = await request(app)
      .post('/api/v1/promotions/validate')
      .set('Cookie', cookies)
      .send({ code: 'UNKNOWN', months: 1 })
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('PROMO_NOT_FOUND')
  })

  it('returns ValidatePromoResult with discounted amount', async () => {
    const cookies = await registerAndLogin()
    await seedPromo({ code: 'SAVE20', discountType: 'percentage', discountValue: 20 })
    const res = await request(app)
      .post('/api/v1/promotions/validate')
      .set('Cookie', cookies)
      .send({ code: 'SAVE20', months: 1 })
    expect(res.status).toBe(200)
    expect(res.body.data.baseAmount).toBe(149)
    expect(res.body.data.finalAmount).toBe(119) // 149 * 0.8 = 119.2 → floor = 119
    expect(res.body.data.code).toBe('SAVE20')
  })
})

describe('GET /api/v1/promotions', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/promotions')
    expect(res.status).toBe(401)
  })

  it('returns 403 FORBIDDEN for coach role', async () => {
    const cookies = await registerAndLogin()
    const res = await request(app).get('/api/v1/promotions').set('Cookie', cookies)
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('returns all promotions for super_admin', async () => {
    const adminCookies = await createAdminAndLogin()
    await seedPromo({ code: 'FIRST' })
    await seedPromo({ code: 'SECOND' })
    const res = await request(app).get('/api/v1/promotions').set('Cookie', adminCookies)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
  })
})

describe('POST /api/v1/promotions', () => {
  it('returns 403 FORBIDDEN for coach role', async () => {
    const cookies = await registerAndLogin()
    const res = await request(app)
      .post('/api/v1/promotions')
      .set('Cookie', cookies)
      .send({ code: 'X', discountType: 'percentage', discountValue: 10, applicableTiers: ['pro'] })
    expect(res.status).toBe(403)
  })

  it('creates a promotion for super_admin and returns 201', async () => {
    const adminCookies = await createAdminAndLogin()
    const res = await request(app)
      .post('/api/v1/promotions')
      .set('Cookie', adminCookies)
      .send({
        code: 'launch50',
        discountType: 'percentage',
        discountValue: 50,
        applicableTiers: ['pro'],
      })
    expect(res.status).toBe(201)
    expect(res.body.data.code).toBe('LAUNCH50')
    expect(res.body.data.isActive).toBe(true)
  })
})

describe('PATCH /api/v1/promotions/:id', () => {
  it('returns 403 for coach role', async () => {
    const cookies = await registerAndLogin()
    const promo = await seedPromo()
    const res = await request(app)
      .patch(`/api/v1/promotions/${promo._id}`)
      .set('Cookie', cookies)
      .send({ isActive: false })
    expect(res.status).toBe(403)
  })

  it('updates promotion for super_admin', async () => {
    const adminCookies = await createAdminAndLogin()
    const promo = await seedPromo()
    const res = await request(app)
      .patch(`/api/v1/promotions/${promo._id}`)
      .set('Cookie', adminCookies)
      .send({ isActive: false })
    expect(res.status).toBe(200)
    expect(res.body.data.isActive).toBe(false)
  })
})

describe('DELETE /api/v1/promotions/:id', () => {
  it('returns 403 for coach role', async () => {
    const cookies = await registerAndLogin()
    const promo = await seedPromo()
    const res = await request(app).delete(`/api/v1/promotions/${promo._id}`).set('Cookie', cookies)
    expect(res.status).toBe(403)
  })

  it('deactivates promotion for super_admin', async () => {
    const adminCookies = await createAdminAndLogin()
    const promo = await seedPromo()
    const res = await request(app)
      .delete(`/api/v1/promotions/${promo._id}`)
      .set('Cookie', adminCookies)
    expect(res.status).toBe(200)
    const found = await Promotion.findById(promo._id)
    expect(found?.isActive).toBe(false)
  })
})
