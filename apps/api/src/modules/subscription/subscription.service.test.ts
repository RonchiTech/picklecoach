import { SubscriptionService } from './subscription.service'
import type { ISubscriptionRepository, SubscriptionData } from './subscription.repository'

const GRACE_MS = 7 * 24 * 60 * 60 * 1000

function makeRepo(data: SubscriptionData | null): ISubscriptionRepository {
  return { findByUserId: jest.fn().mockResolvedValue(data) }
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

describe('SubscriptionService.getMySubscription', () => {
  it('throws 404 when user not found', async () => {
    const service = new SubscriptionService(makeRepo(null))
    await expect(service.getMySubscription('unknown')).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('returns daysRemaining > 0 when trial is active', async () => {
    const trialEndsAt = daysFromNow(30)
    const service = new SubscriptionService(
      makeRepo({ tier: 'starter', status: 'trial', trialEndsAt })
    )
    const result = await service.getMySubscription('userId')
    expect(result.daysRemaining).toBe(30)
    expect(result.isLocked).toBe(false)
  })

  it('returns daysRemaining 0 and isLocked false during 7-day grace period', async () => {
    const trialEndsAt = daysFromNow(-3)
    const service = new SubscriptionService(
      makeRepo({ tier: 'starter', status: 'trial', trialEndsAt })
    )
    const result = await service.getMySubscription('userId')
    expect(result.daysRemaining).toBe(0)
    expect(result.isLocked).toBe(false)
    expect(new Date(result.lockedAt).getTime()).toBe(trialEndsAt.getTime() + GRACE_MS)
  })

  it('returns isLocked true when past grace period', async () => {
    const trialEndsAt = daysFromNow(-10)
    const service = new SubscriptionService(
      makeRepo({ tier: 'starter', status: 'trial', trialEndsAt })
    )
    const result = await service.getMySubscription('userId')
    expect(result.isLocked).toBe(true)
  })

  it('returns correct ISO string dates', async () => {
    const trialEndsAt = daysFromNow(15)
    const service = new SubscriptionService(
      makeRepo({ tier: 'starter', status: 'trial', trialEndsAt })
    )
    const result = await service.getMySubscription('userId')
    expect(result.trialEndsAt).toBe(trialEndsAt.toISOString())
    expect(new Date(result.lockedAt).getTime()).toBe(trialEndsAt.getTime() + GRACE_MS)
  })
})
