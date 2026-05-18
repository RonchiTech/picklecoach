import mongoose from 'mongoose'
import { UpgradeRequest } from './upgrade-request.model'
import { UpgradeRequestRepository } from './upgrade-request.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new UpgradeRequestRepository()
const coachId = new mongoose.Types.ObjectId().toString()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await UpgradeRequest.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await UpgradeRequest.deleteMany({})
})

const seed = (overrides: Record<string, unknown> = {}) =>
  repo.create({
    coachId,
    months: 1,
    amountDue: 149,
    discountApplied: 0,
    receiptUrl: 'https://cdn.example.com/r.jpg',
    ...overrides,
  })

describe('UpgradeRequestRepository', () => {
  it('creates an upgrade request with pending status', async () => {
    const req = await seed()
    expect(req._id).toBeDefined()
    expect(req.status).toBe('pending')
  })

  it('findPendingByCoach returns pending request', async () => {
    await seed()
    const found = await repo.findPendingByCoach(coachId)
    expect(found).not.toBeNull()
  })

  it('findPendingByCoach returns null when no pending exists', async () => {
    const found = await repo.findPendingByCoach(coachId)
    expect(found).toBeNull()
  })

  it('findPendingByCoach returns null after approval', async () => {
    const req = await seed()
    await repo.approve(req._id.toString(), {})
    const found = await repo.findPendingByCoach(coachId)
    expect(found).toBeNull()
  })

  it('approve sets status to approved', async () => {
    const req = await seed()
    await repo.approve(req._id.toString(), { notes: 'Looks good' })
    const updated = await repo.findById(req._id.toString())
    expect(updated!.status).toBe('approved')
    expect(updated!.notes).toBe('Looks good')
    expect(updated!.reviewedAt).toBeInstanceOf(Date)
  })

  it('reject sets status to rejected', async () => {
    const req = await seed()
    await repo.reject(req._id.toString(), { notes: 'Invalid receipt' })
    const updated = await repo.findById(req._id.toString())
    expect(updated!.status).toBe('rejected')
    expect(updated!.notes).toBe('Invalid receipt')
  })
})
