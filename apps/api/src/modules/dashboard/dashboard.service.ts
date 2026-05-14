import type { DashboardStats } from '@picklecoach/shared'

export class DashboardService {
  async getStats(_coachId: string): Promise<DashboardStats> {
    return { todaySessions: 0, totalStudents: 0, unpaidBalance: 0 }
  }
}
