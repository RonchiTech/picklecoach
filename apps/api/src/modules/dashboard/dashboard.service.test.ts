import mongoose from 'mongoose'
import { DashboardService } from './dashboard.service'

const validCoachId = new mongoose.Types.ObjectId().toString()

jest.mock('../student/student.model', () => ({
  Student: { countDocuments: jest.fn() },
}))

jest.mock('../session/session.model', () => ({
  Session: { countDocuments: jest.fn() },
}))

jest.mock('../payment/payment.model', () => ({
  Payment: { aggregate: jest.fn() },
}))

import { Student } from '../student/student.model'
import { Session } from '../session/session.model'
import { Payment } from '../payment/payment.model'

let service: DashboardService

beforeEach(() => {
  jest.clearAllMocks()
  service = new DashboardService()
  ;(Student.countDocuments as jest.Mock).mockResolvedValue(0)
  ;(Session.countDocuments as jest.Mock).mockResolvedValue(0)
  ;(Payment.aggregate as jest.Mock).mockResolvedValue([])
})

describe('DashboardService.getStats', () => {
  it('returns zero stats when no students or sessions exist', async () => {
    const stats = await service.getStats(validCoachId)
    expect(stats).toEqual({
      todaySessions: 0,
      totalStudents: 0,
      unpaidBalance: 0,
      monthlyRevenue: 0,
    })
  })

  it('returns real student count from Student model', async () => {
    ;(Student.countDocuments as jest.Mock).mockResolvedValue(5)
    const stats = await service.getStats(validCoachId)
    expect(stats.totalStudents).toBe(5)
    expect(Student.countDocuments).toHaveBeenCalledWith({ coachId: validCoachId, isActive: true })
  })

  it('returns real session count from Session model', async () => {
    ;(Session.countDocuments as jest.Mock).mockResolvedValue(3)
    const stats = await service.getStats(validCoachId)
    expect(stats.todaySessions).toBe(3)
    expect(Session.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        coachId: validCoachId,
        status: { $ne: 'cancelled' },
      })
    )
  })

  it('returns unpaidBalance from Payment.aggregate result', async () => {
    ;(Payment.aggregate as jest.Mock).mockResolvedValue([{ _id: null, total: 2500 }])
    const stats = await service.getStats(validCoachId)
    expect(stats.unpaidBalance).toBe(2500)
  })

  it('returns 0 for unpaidBalance when aggregate returns empty', async () => {
    ;(Payment.aggregate as jest.Mock).mockResolvedValue([])
    const stats = await service.getStats(validCoachId)
    expect(stats.unpaidBalance).toBe(0)
  })

  it('returns numbers for all stat fields', async () => {
    const stats = await service.getStats(validCoachId)
    expect(typeof stats.todaySessions).toBe('number')
    expect(typeof stats.totalStudents).toBe('number')
    expect(typeof stats.unpaidBalance).toBe('number')
    expect(typeof stats.monthlyRevenue).toBe('number')
  })
})
