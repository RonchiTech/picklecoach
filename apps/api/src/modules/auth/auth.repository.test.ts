import mongoose from 'mongoose'
import { User } from './auth.model'
import { UserRepository } from './auth.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new UserRepository()

const seed = (overrides: Record<string, unknown> = {}) =>
  User.create({
    name: 'Coach Ron',
    email: 'ron@test.com',
    passwordHash: 'hash',
    role: 'coach',
    subscriptionTier: 'starter',
    subscriptionStatus: 'trial',
    trialEndsAt: new Date(),
    ...overrides,
  })

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

describe('UserRepository.emailExists', () => {
  it('returns false when email not in DB', async () => {
    expect(await repo.emailExists('ghost@test.com')).toBe(false)
  })

  it('returns true when email exists', async () => {
    await seed()
    expect(await repo.emailExists('ron@test.com')).toBe(true)
  })
})

describe('UserRepository.create', () => {
  it('creates and returns a user document', async () => {
    const user = await repo.create({
      name: 'Coach Ron',
      email: 'ron@test.com',
      passwordHash: 'hashed',
    })
    expect(user.name).toBe('Coach Ron')
    expect(user.email).toBe('ron@test.com')
    expect(user._id).toBeDefined()
  })

  it('persists so the user can be found later', async () => {
    await repo.create({ name: 'Coach Ron', email: 'ron@test.com', passwordHash: 'hashed' })
    expect(await User.findOne({ email: 'ron@test.com' })).not.toBeNull()
  })
})

describe('UserRepository.findByEmail', () => {
  it('returns null when user does not exist', async () => {
    expect(await repo.findByEmail('nobody@test.com')).toBeNull()
  })

  it('returns the user document when found', async () => {
    await seed()
    const user = await repo.findByEmail('ron@test.com')
    expect(user?.name).toBe('Coach Ron')
  })
})

describe('UserRepository.findById', () => {
  it('returns null for an unknown ObjectId', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    expect(await repo.findById(fakeId)).toBeNull()
  })

  it('returns the user document for a valid id', async () => {
    const created = await seed()
    const user = await repo.findById(created._id.toString())
    expect(user?.email).toBe('ron@test.com')
  })
})
