import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from './auth.model'

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

describe('POST /api/v1/auth/register', () => {
  it('creates a user, returns 201, and sets httpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach Ron', email: 'ron@test.com', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.email).toBe('ron@test.com')
    expect(res.body.data.passwordHash).toBeUndefined()
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('returns 409 EMAIL_TAKEN when email is already registered', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach Ron', email: 'ron@test.com', password: 'password123' })

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Other', email: 'ron@test.com', password: 'password123' })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_TAKEN')
  })

  it('returns 400 VALIDATION_ERROR for invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'R', email: 'not-an-email', password: 'short' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach Ron', email: 'ron@test.com', password: 'password123' })
  })

  it('returns 200 and sets cookie on valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ron@test.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe('ron@test.com')
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('returns 401 INVALID_CREDENTIALS on wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ron@test.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('returns 401 on unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' })

    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/auth/me', () => {
  it('returns 401 NOT_AUTHENTICATED without a token cookie', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('NOT_AUTHENTICATED')
  })

  it('returns the authenticated user when a valid cookie is sent', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach Ron', email: 'ron@test.com', password: 'password123' })

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ron@test.com', password: 'password123' })

    const cookie = loginRes.headers['set-cookie'] as unknown as string[]

    const res = await request(app).get('/api/v1/auth/me').set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe('ron@test.com')
  })
})

describe('POST /api/v1/auth/logout', () => {
  it('returns 200 and clears the token cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined
    const tokenCookie = cookies?.find((c) => c.startsWith('token='))
    expect(tokenCookie).toMatch(/Expires=Thu, 01 Jan 1970/)
  })
})
