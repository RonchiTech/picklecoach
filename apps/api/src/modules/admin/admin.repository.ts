import mongoose from 'mongoose'
import type {
  AdminChurned,
  AdminCoach,
  AdminCoachDetail,
  AdminExpiringSoon,
  AdminRevenueMonth,
  AdminStats,
  SubscriptionStatus,
  SubscriptionTier,
} from '@picklecoach/shared'
import { User } from '../auth/auth.model'
import { UpgradeRequest } from '../upgrade-request/upgrade-request.model'
import { Student } from '../student/student.model'
import { Session } from '../session/session.model'

export class AdminRepository {
  async getStats(): Promise<AdminStats> {
    const [totalCoaches, activeSubscriptions] = await Promise.all([
      User.countDocuments({ role: 'coach' }),
      User.countDocuments({ role: 'coach', subscriptionTier: 'pro' }),
    ])
    return { totalCoaches, activeTrials: 0, activeSubscriptions }
  }

  async listCoaches(filters?: {
    tier?: SubscriptionTier
    status?: SubscriptionStatus
  }): Promise<AdminCoach[]> {
    type CoachRow = {
      _id: { toString(): string }
      name: string
      email: string
      subscriptionTier: string
      subscriptionStatus: string
      createdAt: Date
    }
    const query: Record<string, unknown> = { role: 'coach' }
    if (filters?.tier) query.subscriptionTier = filters.tier
    if (filters?.status) query.subscriptionStatus = filters.status

    const coaches = await User.find(query)
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

  async getCoachDetail(coachId: string): Promise<AdminCoachDetail | null> {
    type CoachRow = {
      _id: mongoose.Types.ObjectId
      name: string
      email: string
      subscriptionTier: string
      subscriptionStatus: string
      proEndsAt?: Date
      createdAt: Date
    }
    const coach = await User.findOne({ _id: coachId, role: 'coach' })
      .select('name email subscriptionTier subscriptionStatus proEndsAt createdAt')
      .lean<CoachRow>()
    if (!coach) return null

    type HistoryRow = {
      _id: mongoose.Types.ObjectId
      months: number
      amountDue: number
      discountApplied: number
      promoCode?: string
      reviewedAt?: Date
    }

    const [history, studentCount, sessionCount, lastSession] = await Promise.all([
      UpgradeRequest.find({ coachId: coach._id, status: 'approved' })
        .sort({ reviewedAt: 1 })
        .select('months amountDue discountApplied promoCode reviewedAt')
        .lean<HistoryRow[]>(),
      Student.countDocuments({ coachId: coach._id }),
      Session.countDocuments({ coachId: coach._id }),
      Session.findOne({ coachId: coach._id })
        .sort({ scheduledAt: -1 })
        .select('scheduledAt')
        .lean<{ scheduledAt: Date } | null>(),
    ])

    return {
      _id: coach._id.toString(),
      name: coach.name,
      email: coach.email,
      subscriptionTier: coach.subscriptionTier as AdminCoachDetail['subscriptionTier'],
      subscriptionStatus: coach.subscriptionStatus as AdminCoachDetail['subscriptionStatus'],
      proEndsAt: coach.proEndsAt?.toISOString(),
      createdAt: coach.createdAt.toISOString(),
      studentCount,
      sessionCount,
      lastSessionAt: lastSession?.scheduledAt?.toISOString(),
      subscriptionHistory: history.map((h) => ({
        _id: h._id.toString(),
        months: h.months,
        amountDue: h.amountDue,
        discountApplied: h.discountApplied,
        promoCode: h.promoCode,
        approvedAt: h.reviewedAt?.toISOString() ?? '',
      })),
    }
  }

  async listExpiringCoaches(): Promise<AdminExpiringSoon[]> {
    const cutoff = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    type CoachRow = {
      _id: mongoose.Types.ObjectId
      name: string
      email: string
      proEndsAt: Date
    }
    const coaches = await User.find({
      role: 'coach',
      subscriptionTier: 'pro',
      proEndsAt: { $lte: cutoff },
    })
      .select('name email proEndsAt')
      .sort({ proEndsAt: 1 })
      .lean<CoachRow[]>()

    const now = Date.now()
    return coaches.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      email: c.email,
      proEndsAt: c.proEndsAt.toISOString(),
      daysLeft: Math.max(0, Math.ceil((c.proEndsAt.getTime() - now) / (1000 * 60 * 60 * 24))),
    }))
  }

  async listChurnedCoaches(): Promise<AdminChurned[]> {
    type AggRow = {
      _id: mongoose.Types.ObjectId
      lastApprovedAt: Date
      coach: { name: string; email: string }
    }
    const rows = await UpgradeRequest.aggregate<AggRow>([
      { $match: { status: 'approved' } },
      { $sort: { reviewedAt: -1 } },
      { $group: { _id: '$coachId', lastApprovedAt: { $first: '$reviewedAt' } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'coach',
          pipeline: [
            { $match: { subscriptionTier: 'starter' } },
            { $project: { name: 1, email: 1 } },
          ],
        },
      },
      { $unwind: '$coach' },
      { $sort: { lastApprovedAt: -1 } },
    ])
    return rows.map((r) => ({
      _id: r._id.toString(),
      name: r.coach.name,
      email: r.coach.email,
      lastApprovedAt: r.lastApprovedAt.toISOString(),
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
