import type { DashboardStats } from '@picklecoach/shared'
import { Student } from '../student/student.model'
import { Session } from '../session/session.model'

export class DashboardService {
  async getStats(coachId: string): Promise<DashboardStats> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [totalStudents, todaySessions] = await Promise.all([
      Student.countDocuments({ coachId, isActive: true }),
      Session.countDocuments({
        coachId,
        scheduledAt: { $gte: todayStart, $lte: todayEnd },
        status: { $ne: 'cancelled' },
      }),
    ])

    return { todaySessions, totalStudents, unpaidBalance: 0 }
  }
}
