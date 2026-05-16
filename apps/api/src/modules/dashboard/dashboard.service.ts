import type { DashboardStats } from '@picklecoach/shared'
import { Student } from '../student/student.model'

export class DashboardService {
  async getStats(coachId: string): Promise<DashboardStats> {
    const totalStudents = await Student.countDocuments({ coachId, isActive: true })
    return { todaySessions: 0, totalStudents, unpaidBalance: 0 }
  }
}
