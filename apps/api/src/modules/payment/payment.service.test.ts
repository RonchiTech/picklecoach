import { PaymentService } from './payment.service'
import type { IPaymentRepository } from './payment.repository'
import type { IPayment } from './payment.model'
import mongoose from 'mongoose'

const COACH_ID = 'coach-123'
const PAYMENT_ID = new mongoose.Types.ObjectId().toString()
const STUDENT_ID = new mongoose.Types.ObjectId().toString()

const mockPayment = {
  _id: { toString: () => PAYMENT_ID },
  coachId: { toString: () => COACH_ID },
  studentId: { toString: () => STUDENT_ID },
  amount: 1000,
  method: 'cash',
  status: 'unpaid',
} as unknown as IPayment

const mockRepo: jest.Mocked<IPaymentRepository> = {
  findAllByCoach: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  sumUnpaidByCoach: jest.fn(),
}

let service: PaymentService

beforeEach(() => {
  jest.clearAllMocks()
  service = new PaymentService(mockRepo)
})

describe('PaymentService.list', () => {
  it('returns paginated result with page and limit', async () => {
    mockRepo.findAllByCoach.mockResolvedValue({ payments: [mockPayment], total: 1 })
    const result = await service.list(COACH_ID, 1, 20)
    expect(result.payments).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(mockRepo.findAllByCoach).toHaveBeenCalledWith(COACH_ID, 1, 20)
  })
})

describe('PaymentService.getOne', () => {
  it('throws PAYMENT_NOT_FOUND when payment does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null)
    await expect(service.getOne(COACH_ID, PAYMENT_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'PAYMENT_NOT_FOUND',
    })
  })

  it('returns the payment when found', async () => {
    mockRepo.findById.mockResolvedValue(mockPayment)
    const result = await service.getOne(COACH_ID, PAYMENT_ID)
    expect(result.amount).toBe(1000)
  })
})

describe('PaymentService.create', () => {
  it('sets paidAt when status is paid', async () => {
    mockRepo.create.mockResolvedValue(mockPayment)
    await service.create(COACH_ID, {
      studentId: STUDENT_ID,
      amount: 1000,
      method: 'cash',
      status: 'paid',
    })
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ paidAt: expect.any(Date) })
    )
  })

  it('does not set paidAt when status is unpaid', async () => {
    mockRepo.create.mockResolvedValue(mockPayment)
    await service.create(COACH_ID, {
      studentId: STUDENT_ID,
      amount: 1000,
      method: 'cash',
      status: 'unpaid',
    })
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ paidAt: undefined }))
  })
})

describe('PaymentService.update', () => {
  it('throws PAYMENT_NOT_FOUND when payment does not exist', async () => {
    mockRepo.update.mockResolvedValue(null)
    await expect(service.update(COACH_ID, PAYMENT_ID, { status: 'paid' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'PAYMENT_NOT_FOUND',
    })
  })

  it('sets paidAt when updating status to paid', async () => {
    const paid = { ...mockPayment, status: 'paid' } as unknown as IPayment
    mockRepo.update.mockResolvedValue(paid)
    await service.update(COACH_ID, PAYMENT_ID, { status: 'paid' })
    expect(mockRepo.update).toHaveBeenCalledWith(
      PAYMENT_ID,
      COACH_ID,
      expect.objectContaining({ paidAt: expect.any(Date) })
    )
  })

  it('clears paidAt when updating status to unpaid', async () => {
    mockRepo.update.mockResolvedValue(mockPayment)
    await service.update(COACH_ID, PAYMENT_ID, { status: 'unpaid' })
    expect(mockRepo.update).toHaveBeenCalledWith(
      PAYMENT_ID,
      COACH_ID,
      expect.objectContaining({ paidAt: null })
    )
  })

  it('returns the updated payment', async () => {
    const updated = { ...mockPayment, amount: 500 } as unknown as IPayment
    mockRepo.update.mockResolvedValue(updated)
    const result = await service.update(COACH_ID, PAYMENT_ID, { amount: 500 })
    expect(result.amount).toBe(500)
  })
})

describe('PaymentService.delete', () => {
  it('throws PAYMENT_NOT_FOUND when payment does not exist', async () => {
    mockRepo.delete.mockResolvedValue(false)
    await expect(service.delete(COACH_ID, PAYMENT_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'PAYMENT_NOT_FOUND',
    })
  })

  it('resolves without error when payment is deleted', async () => {
    mockRepo.delete.mockResolvedValue(true)
    await expect(service.delete(COACH_ID, PAYMENT_ID)).resolves.toBeUndefined()
  })
})
