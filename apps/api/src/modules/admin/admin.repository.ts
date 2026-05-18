import type {
  AdminCoach,
  AdminRevenueMonth,
  AdminStats,
  SubscriptionTier,
} from '@picklecoach/shared'
import { User } from '../auth/auth.model'
import { UpgradeRequest } from '../upgrade-request/upgrade-request.model'

export class AdminRepository {
  async getStats(): Promise<AdminStats> {
    const [totalCoaches, activeSubscriptions] = await Promise.all([
      User.countDocuments({ role: 'coach' }),
      User.countDocuments({ role: 'coach', subscriptionTier: 'pro' }),
    ])
    return { totalCoaches, activeTrials: 0, activeSubscriptions }
  }

  async listCoaches(): Promise<AdminCoach[]> {
    type CoachRow = {
      _id: { toString(): string }
      name: string
      email: string
      subscriptionTier: string
      subscriptionStatus: string
      createdAt: Date
    }
    const coaches = await User.find({ role: 'coach' })
      .select('name email subscriptionTier subscriptionStatus createdAt')
      .sort({ createdAt: -1 })
      .lean<CoachRow[]>()
    return coaches.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      email: c.email,
      subscriptionTier: c.subscriptionTier as AdminCoach['subscriptionTier'],
      subscriptionStatus: c.subscriptionStatus as AdminCoach['subscriptionStatus'],
      createdAt: c.createdAt.toISOString(),
    }))
  }

  async updateCoachSubscription(
    coachId: string,
    tier: SubscriptionTier,
    proEndsAt?: string
  ): Promise<void> {
    const update: Record<string, unknown> = {
      subscriptionTier: tier,
      subscriptionStatus: 'active',
    }
    if (tier === 'pro' && proEndsAt) {
      update.proEndsAt = new Date(proEndsAt)
    } else if (tier === 'starter') {
      update.proEndsAt = null
    }
    await User.findByIdAndUpdate(coachId, { $set: update })
  }

  async getRevenueSummary(): Promise<AdminRevenueMonth[]> {
    type AggRow = { _id: string; revenue: number; count: number }
    const rows = await UpgradeRequest.aggregate<AggRow>([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$reviewedAt' } },
          revenue: { $sum: '$amountDue' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ])
    return rows.map((r) => ({ month: r._id, revenue: r.revenue, count: r.count }))
  }
}
