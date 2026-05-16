import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'
import { Student } from '../student/student.model'
import { Payment } from './payment.model'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
  await Payment.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
  await Payment.deleteMany({})
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

describe('GET /api/v1/payments', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/payments')
    expect(res.status).toBe(401)
  })

  it('returns paginated empty list when coach has no payments', async () => {
    const { cookie } = await loginAndGetCookie()
    const res = await request(app).get('/api/v1/payments').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.data.payments).toEqual([])
    expect(res.body.data.total).toBe(0)
    expect(res.body.data.page).toBe(1)
    expect(res.body.data.limit).toBe(20)
  })
})

describe('POST /api/v1/payments', () => {
  it('creates a payment and returns 201', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 1000, method: 'cash', status: 'unpaid' })

    expect(res.status).toBe(201)
    expect(res.body.data.amount).toBe(1000)
    expect(res.body.data.method).toBe('cash')
    expect(res.body.data.status).toBe('unpaid')
    expect(res.body.data.paidAt).toBeUndefined()
  })

  it('sets paidAt when status is paid', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 500, method: 'gcash', status: 'paid' })

    expect(res.status).toBe(201)
    expect(res.body.data.paidAt).toBeDefined()
  })

  it('returns 400 VALIDATION_ERROR when studentId is missing', async () => {
    const { cookie } = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ amount: 1000 })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('appears in the payment list after creation', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 750, method: 'bank_transfer', status: 'partial' })

    const res = await request(app).get('/api/v1/payments').set('Cookie', cookie)
    expect(res.body.data.payments).toHaveLength(1)
    expect(res.body.data.total).toBe(1)
    expect(res.body.data.payments[0].amount).toBe(750)
  })
})

describe('GET /api/v1/payments/:id', () => {
  it('returns 404 PAYMENT_NOT_FOUND for unknown id', async () => {
    const { cookie } = await loginAndGetCookie()
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app).get(`/api/v1/payments/${fakeId}`).set('Cookie', cookie)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('PAYMENT_NOT_FOUND')
  })

  it('returns the payment when found', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 1000, method: 'cash', status: 'unpaid' })

    const res = await request(app)
      .get(`/api/v1/payments/${created.body.data._id}`)
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.data._id).toBe(created.body.data._id)
  })
})

describe('PATCH /api/v1/payments/:id', () => {
  it('updates status and sets paidAt when marking paid', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 1000, method: 'cash', status: 'unpaid' })

    const res = await request(app)
      .patch(`/api/v1/payments/${created.body.data._id}`)
      .set('Cookie', cookie)
      .send({ status: 'paid' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('paid')
    expect(res.body.data.paidAt).toBeDefined()
  })

  it('returns 404 for a payment belonging to another coach', async () => {
    const { cookie: cookieA, studentId } = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookieA)
      .send({ studentId, amount: 1000, method: 'cash', status: 'unpaid' })

    await User.deleteMany({})
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach B', email: 'b@test.com', password: 'password123' })
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'b@test.com', password: 'password123' })
    const cookieB = loginB.headers['set-cookie'] as unknown as string[]

    const res = await request(app)
      .patch(`/api/v1/payments/${created.body.data._id}`)
      .set('Cookie', cookieB)
      .send({ status: 'paid' })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/v1/payments/:id', () => {
  it('deletes the payment and returns success', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 1000, method: 'cash', status: 'unpaid' })

    const res = await request(app)
      .delete(`/api/v1/payments/${created.body.data._id}`)
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.data).toBeNull()

    const check = await request(app)
      .get(`/api/v1/payments/${created.body.data._id}`)
      .set('Cookie', cookie)
    expect(check.status).toBe(404)
  })

  it('returns 404 when deleting non-existent payment', async () => {
    const { cookie } = await loginAndGetCookie()
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app).delete(`/api/v1/payments/${fakeId}`).set('Cookie', cookie)
    expect(res.status).toBe(404)
  })
})

describe('sumUnpaidByCoach via dashboard', () => {
  it('unpaidBalance reflects unpaid + partial payments', async () => {
    const { cookie, studentId } = await loginAndGetCookie()

    await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 1000, method: 'cash', status: 'unpaid' })
    await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 500, method: 'gcash', status: 'partial' })
    await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 800, method: 'cash', status: 'paid' })

    const res = await request(app).get('/api/v1/dashboard/stats').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.data.unpaidBalance).toBe(1500)
  })
})
