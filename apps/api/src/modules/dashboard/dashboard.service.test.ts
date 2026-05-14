import { DashboardService } from './dashboard.service'

let service: DashboardService

beforeEach(() => {
  service = new DashboardService()
})

describe('DashboardService.getStats', () => {
  it('returns zero stats when no data exists', async () => {
    const stats = await service.getStats('any-coach-id')
    expect(stats).toEqual({
      todaySessions: 0,
      totalStudents: 0,
      unpaidBalance: 0,
    })
  })

  it('returns numbers for all three stat fields', async () => {
    const stats = await service.getStats('coach-123')
    expect(typeof stats.todaySessions).toBe('number')
    expect(typeof stats.totalStudents).toBe('number')
    expect(typeof stats.unpaidBalance).toBe('number')
  })
})
