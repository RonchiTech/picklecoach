import { User } from '../auth/auth.model'
import type { SubscriptionTier, SubscriptionStatus } from '@picklecoach/shared'

export interface SubscriptionData {
  tier: SubscriptionTier
  status: SubscriptionStatus
  trialEndsAt: Date
}

export interface ISubscriptionRepository {
  findByUserId(userId: string): Promise<SubscriptionData | null>
}

export class SubscriptionRepository implements ISubscriptionRepository {
  async findByUserId(userId: string): Promise<SubscriptionData | null> {
    const user = await User.findById(userId).select(
      'subscriptionTier subscriptionStatus trialEndsAt'
    )
    if (!user) return null
    return {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
    }
  }
}
