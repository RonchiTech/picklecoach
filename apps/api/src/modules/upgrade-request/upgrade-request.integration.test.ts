import request from 'supertest'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'

jest.mock('./upgrade-request.service', () => {
  const actual = jest.requireActual('./upgrade-request.service')
  return {
    ...actual,
    UpgradeRequestService: jest.fn().mockImplementation(() => ({
      submit: jest
        .fn()
        .mockResolvedValue({ _id: 'r1', status: 'pending', months: 1, amountDue: 149 }),
      getMine: jest.fn().mockResolvedValue(null),
      listAll: jest.fn().mockResolvedValue([]),
      approve: jest.fn().mockResolvedValue(undefined),
      reject: jest.fn().mockResolvedValue(undefined),
    })),
  }
})

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

function makeToken(userId: string, role: 'coach' | 'super_admin' = 'coach') {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET ?? 'test-secret-key-12345678', {
    expiresIn: '1h',
  })
}

describe('Upgrade Request Routes', () => {
  it('GET /api/v1/upgrade-requests/mine returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/upgrade-requests/mine')
    expect(res.status).toBe(401)
  })

  it('GET /api/v1/upgrade-requests returns 403 for coach', async () => {
    const coach = await User.create({ name: 'C', email: 'c@test.com', passwordHash: 'x' })
    const token = makeToken(coach._id.toString())
    const res = await request(app).get('/api/v1/upgrade-requests').set('Cookie', `token=${token}`)
    expect(res.status).toBe(403)
  })

  it('GET /api/v1/upgrade-requests returns 200 for super_admin', async () => {
    const admin = await User.create({
      name: 'A',
      email: 'a@test.com',
      passwordHash: 'x',
      role: 'super_admin',
    })
    const token = makeToken(admin._id.toString(), 'super_admin')
    const res = await request(app).get('/api/v1/upgrade-requests').set('Cookie', `token=${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('GET /api/v1/upgrade-requests/mine returns 200 for coach', async () => {
    const coach = await User.create({ name: 'C2', email: 'c2@test.com', passwordHash: 'x' })
    const token = makeToken(coach._id.toString())
    const res = await request(app)
      .get('/api/v1/upgrade-requests/mine')
      .set('Cookie', `token=${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toBeNull()
  })

  it('PATCH /api/v1/upgrade-requests/:id/review returns 403 for coach', async () => {
    const coach = await User.create({ name: 'C3', email: 'c3@test.com', passwordHash: 'x' })
    const token = makeToken(coach._id.toString())
    const res = await request(app)
      .patch('/api/v1/upgrade-requests/someid/review')
      .set('Cookie', `token=${token}`)
      .send({ action: 'approved' })
    expect(res.status).toBe(403)
  })
})
