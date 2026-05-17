import type { AdminCoach, AdminStats, SubscriptionTier } from '@picklecoach/shared'
import { User } from '../auth/auth.model'

export class AdminRepository {
  async getStats(): Promise<AdminStats> {
    const [totalCoaches, activeTrials, activeSubscriptions] = await Promise.all([
      User.countDocuments({ role: 'coach' }),
      User.countDocuments({ role: 'coach', subscriptionStatus: 'trial' }),
      User.countDocuments({ role: 'coach', subscriptionStatus: 'active' }),
    ])
    return { totalCoaches, activeTrials, activeSubscriptions }
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

  async updateCoachSubscription(coachId: string, tier: SubscriptionTier): Promise<void> {
    await User.findByIdAndUpdate(coachId, {
      subscriptionTier: tier,
      subscriptionStatus: 'active',
    })
  }
}
