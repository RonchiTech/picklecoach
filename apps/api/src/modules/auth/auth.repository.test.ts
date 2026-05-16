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

describe('UserRepository.update', () => {
  it('updates name and returns the new document', async () => {
    const created = await seed()
    const updated = await repo.update(created._id.toString(), { name: 'Coach Updated' })
    expect(updated?.name).toBe('Coach Updated')
  })

  it('updates phone and returns the new document', async () => {
    const created = await seed()
    const updated = await repo.update(created._id.toString(), { phone: '+63 912 345 6789' })
    expect(updated?.phone).toBe('+63 912 345 6789')
  })

  it('returns null for an unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const result = await repo.update(fakeId, { name: 'Ghost' })
    expect(result).toBeNull()
  })
})

describe('UserRepository.updatePassword', () => {
  it('sets a new passwordHash on the user', async () => {
    const created = await seed()
    await repo.updatePassword(created._id.toString(), 'new-hash')
    const found = await User.findById(created._id)
    expect(found?.passwordHash).toBe('new-hash')
  })
})

describe('UserRepository.setResetToken', () => {
  it('stores tokenHash and expiresAt on the user', async () => {
    const user = await repo.create({
      name: 'Coach Ron',
      email: 'ron@test.com',
      passwordHash: 'hash',
    })
    const expiresAt = new Date(Date.now() + 3600_000)
    await repo.setResetToken(user._id.toString(), 'abc123hash', expiresAt)
    const updated = await User.findById(user._id).select(
      '+resetPasswordToken +resetPasswordExpiresAt'
    )
    expect(updated?.resetPasswordToken).toBe('abc123hash')
    expect(updated?.resetPasswordExpiresAt?.getTime()).toBeCloseTo(expiresAt.getTime(), -3)
  })
})

describe('UserRepository.findByResetToken', () => {
  it('returns null when no user has that token hash', async () => {
    const result = await repo.findByResetToken('nonexistent-hash')
    expect(result).toBeNull()
  })

  it('returns the user when token hash matches', async () => {
    const user = await repo.create({
      name: 'Coach Ron',
      email: 'ron@test.com',
      passwordHash: 'hash',
    })
    await repo.setResetToken(user._id.toString(), 'myhash', new Date(Date.now() + 3600_000))
    const found = await repo.findByResetToken('myhash')
    expect(found?.email).toBe('ron@test.com')
    expect(found?.resetPasswordToken).toBe('myhash')
    expect(found?.resetPasswordExpiresAt).toBeDefined()
  })
})

describe('UserRepository.clearResetToken', () => {
  it('removes resetPasswordToken and resetPasswordExpiresAt from the user', async () => {
    const user = await repo.create({
      name: 'Coach Ron',
      email: 'ron@test.com',
      passwordHash: 'hash',
    })
    await repo.setResetToken(user._id.toString(), 'myhash', new Date(Date.now() + 3600_000))
    await repo.clearResetToken(user._id.toString())
    const updated = await User.findById(user._id).select(
      '+resetPasswordToken +resetPasswordExpiresAt'
    )
    expect(updated?.resetPasswordToken).toBeUndefined()
    expect(updated?.resetPasswordExpiresAt).toBeUndefined()
  })
})
