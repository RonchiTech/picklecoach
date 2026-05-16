import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'
import { CoachProfile } from './coach-profile.model'

jest.mock('../../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: jest.fn(
        (_opts: unknown, cb: (err: null, result: { secure_url: string }) => void) => {
          cb(null, { secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg' })
          return { end: jest.fn() }
        }
      ),
    },
  },
}))

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await CoachProfile.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
  await CoachProfile.deleteMany({})
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

describe('GET /api/v1/coach-profiles/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/coach-profiles/me')
    expect(res.status).toBe(401)
  })

  it('returns the profile created during registration', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app).get('/api/v1/coach-profiles/me').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.data.displayName).toBe('Coach Ron')
    expect(res.body.data.slug).toMatch(/^coach-ron-[a-z0-9]{4}$/)
    expect(res.body.data.isPublic).toBe(false)
  })
})

describe('PATCH /api/v1/coach-profiles/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).patch('/api/v1/coach-profiles/me').send({ displayName: 'New' })
    expect(res.status).toBe(401)
  })

  it('updates profile fields and returns the updated profile', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app)
      .patch('/api/v1/coach-profiles/me')
      .set('Cookie', cookie)
      .send({
        displayName: 'Coach Ron Updated',
        city: 'Makati',
        specializations: ['beginner', 'dinking'],
        sessionTypes: ['private'],
        isPublic: true,
      })
    expect(res.status).toBe(200)
    expect(res.body.data.displayName).toBe('Coach Ron Updated')
    expect(res.body.data.city).toBe('Makati')
    expect(res.body.data.specializations).toEqual(['beginner', 'dinking'])
    expect(res.body.data.isPublic).toBe(true)
  })

  it('returns 400 VALIDATION_ERROR for invalid specialization', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app)
      .patch('/api/v1/coach-profiles/me')
      .set('Cookie', cookie)
      .send({ specializations: ['invalid-spec'] })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/v1/coach-profiles/me/photo', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/v1/coach-profiles/me/photo')
    expect(res.status).toBe(401)
  })

  it('returns 400 when no file is uploaded', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app).post('/api/v1/coach-profiles/me/photo').set('Cookie', cookie)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('NO_FILE')
  })

  it('uploads photo and returns the Cloudinary URL', async () => {
    const cookie = await loginAndGetCookie()
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    const res = await request(app)
      .post('/api/v1/coach-profiles/me/photo')
      .set('Cookie', cookie)
      .attach('photo', testImageBuffer, { filename: 'test.png', contentType: 'image/png' })
    expect(res.status).toBe(200)
    expect(res.body.data.photoUrl).toBe('https://res.cloudinary.com/test/image/upload/test.jpg')
  })
})
