import mongoose from 'mongoose'
import type { DashboardStats } from '@picklecoach/shared'
import { Student } from '../student/student.model'
import { Session } from '../session/session.model'
import { Payment } from '../payment/payment.model'

export class DashboardService {
  async getStats(coachId: string): Promise<DashboardStats> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const [totalStudents, todaySessions, unpaidResult, revenueResult] = await Promise.all([
      Student.countDocuments({ coachId, isActive: true }),
      Session.countDocuments({
        coachId,
        scheduledAt: { $gte: todayStart, $lte: todayEnd },
        status: { $ne: 'cancelled' },
      }),
      Payment.aggregate([
        {
          $match: {
            coachId: new mongoose.Types.ObjectId(coachId),
            status: { $in: ['unpaid', 'partial'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            coachId: new mongoose.Types.ObjectId(coachId),
            status: 'paid',
            paidAt: { $gte: monthStart },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ])

    return {
      todaySessions,
      totalStudents,
      unpaidBalance: unpaidResult[0]?.total ?? 0,
      monthlyRevenue: revenueResult[0]?.total ?? 0,
    }
  }
}
