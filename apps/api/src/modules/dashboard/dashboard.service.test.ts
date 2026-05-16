import { DashboardService } from './dashboard.service'

jest.mock('../student/student.model', () => ({
  Student: { countDocuments: jest.fn() },
}))

import { Student } from '../student/student.model'

let service: DashboardService

beforeEach(() => {
  jest.clearAllMocks()
  service = new DashboardService()
  ;(Student.countDocuments as jest.Mock).mockResolvedValue(0)
})

describe('DashboardService.getStats', () => {
  it('returns zero stats when no students exist', async () => {
    const stats = await service.getStats('any-coach-id')
    expect(stats).toEqual({ todaySessions: 0, totalStudents: 0, unpaidBalance: 0 })
  })

  it('returns real student count from Student model', async () => {
    ;(Student.countDocuments as jest.Mock).mockResolvedValue(5)
    const stats = await service.getStats('coach-abc')
    expect(stats.totalStudents).toBe(5)
    expect(Student.countDocuments).toHaveBeenCalledWith({ coachId: 'coach-abc', isActive: true })
  })

  it('returns numbers for all three stat fields', async () => {
    const stats = await service.getStats('coach-123')
    expect(typeof stats.todaySessions).toBe('number')
    expect(typeof stats.totalStudents).toBe('number')
    expect(typeof stats.unpaidBalance).toBe('number')
  })
})
