import type { SubscriptionInfo } from '@picklecoach/shared'
import type { ISubscriptionRepository } from './subscription.repository'
import { createError } from '../../middleware/error.middleware'

const GRACE_MS = 7 * 24 * 60 * 60 * 1000

export class SubscriptionService {
  constructor(private repo: ISubscriptionRepository) {}

  async getMySubscription(userId: string): Promise<SubscriptionInfo> {
    const data = await this.repo.findByUserId(userId)
    if (!data) throw createError('User not found', 404, 'USER_NOT_FOUND')

    const now = Date.now()
    const trialEnd = data.trialEndsAt.getTime()
    const lockEnd = trialEnd + GRACE_MS

    return {
      tier: data.tier,
      status: data.status,
      trialEndsAt: data.trialEndsAt.toISOString(),
      lockedAt: new Date(lockEnd).toISOString(),
      daysRemaining: Math.max(0, Math.floor((trialEnd - now) / (24 * 60 * 60 * 1000))),
      isLocked: now > lockEnd,
    }
  }
}
