import mongoose from 'mongoose'
import { Payment } from './payment.model'
import { PaymentRepository } from './payment.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new PaymentRepository()

const COACH_A = new mongoose.Types.ObjectId().toString()
const COACH_B = new mongoose.Types.ObjectId().toString()
const STUDENT_ID = new mongoose.Types.ObjectId()

const seed = (overrides: Record<string, unknown> = {}) =>
  Payment.create({
    coachId: COACH_A,
    studentId: STUDENT_ID,
    amount: 1000,
    method: 'cash',
    status: 'unpaid',
    ...overrides,
  })

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await Payment.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await Payment.deleteMany({})
})

describe('PaymentRepository.findAllByCoach', () => {
  it('returns empty array and zero total when coach has no payments', async () => {
    const result = await repo.findAllByCoach(COACH_A, 1, 20)
    expect(result.payments).toEqual([])
    expect(result.total).toBe(0)
  })

  it('returns only payments belonging to the given coach', async () => {
    await seed()
    await seed({ coachId: COACH_B })
    const result = await repo.findAllByCoach(COACH_A, 1, 20)
    expect(result.payments).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('paginates correctly', async () => {
    await seed({ amount: 100 })
    await seed({ amount: 200 })
    await seed({ amount: 300 })

    const page1 = await repo.findAllByCoach(COACH_A, 1, 2)
    expect(page1.payments).toHaveLength(2)
    expect(page1.total).toBe(3)

    const page2 = await repo.findAllByCoach(COACH_A, 2, 2)
    expect(page2.payments).toHaveLength(1)
    expect(page2.total).toBe(3)
  })

  it('returns payments sorted by createdAt descending', async () => {
    await seed({ amount: 100 })
    await seed({ amount: 200 })
    const result = await repo.findAllByCoach(COACH_A, 1, 20)
    expect(result.payments[0].amount).toBe(200)
    expect(result.payments[1].amount).toBe(100)
  })
})

describe('PaymentRepository.findById', () => {
  it('returns null for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    expect(await repo.findById(fakeId, COACH_A)).toBeNull()
  })

  it('returns null when payment belongs to a different coach', async () => {
    const payment = await seed()
    expect(await repo.findById(payment._id.toString(), COACH_B)).toBeNull()
  })

  it('returns the payment when id and coachId match', async () => {
    const payment = await seed({ amount: 500 })
    const found = await repo.findById(payment._id.toString(), COACH_A)
    expect(found?.amount).toBe(500)
  })
})

describe('PaymentRepository.create', () => {
  it('creates a payment with the correct fields', async () => {
    const payment = await repo.create({
      coachId: COACH_A,
      studentId: STUDENT_ID.toString(),
      amount: 750,
      method: 'gcash',
      status: 'unpaid',
    })
    expect(payment.coachId.toString()).toBe(COACH_A)
    expect(payment.amount).toBe(750)
    expect(payment.method).toBe('gcash')
    expect(payment.status).toBe('unpaid')
  })
})

describe('PaymentRepository.update', () => {
  it('returns null when payment not found or wrong coach', async () => {
    const payment = await seed()
    expect(await repo.update(payment._id.toString(), COACH_B, { status: 'paid' })).toBeNull()
  })

  it('updates and returns the updated payment', async () => {
    const payment = await seed()
    const updated = await repo.update(payment._id.toString(), COACH_A, {
      status: 'paid',
      amount: 1500,
    })
    expect(updated?.status).toBe('paid')
    expect(updated?.amount).toBe(1500)
  })
})

describe('PaymentRepository.delete', () => {
  it('returns false when payment not found or wrong coach', async () => {
    const payment = await seed()
    expect(await repo.delete(payment._id.toString(), COACH_B)).toBe(false)
  })

  it('deletes and returns true when found', async () => {
    const payment = await seed()
    const result = await repo.delete(payment._id.toString(), COACH_A)
    expect(result).toBe(true)
    expect(await Payment.findById(payment._id)).toBeNull()
  })
})

describe('PaymentRepository.sumUnpaidByCoach', () => {
  it('returns 0 when coach has no payments', async () => {
    expect(await repo.sumUnpaidByCoach(COACH_A)).toBe(0)
  })

  it('sums only unpaid and partial amounts, not paid', async () => {
    await seed({ amount: 1000, status: 'unpaid' })
    await seed({ amount: 500, status: 'partial' })
    await seed({ amount: 800, status: 'paid' })
    await seed({ coachId: COACH_B, amount: 999, status: 'unpaid' })

    expect(await repo.sumUnpaidByCoach(COACH_A)).toBe(1500)
  })
})
