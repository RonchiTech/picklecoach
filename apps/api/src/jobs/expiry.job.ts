import { schedule } from 'node-cron'
import { User } from '../modules/auth/auth.model'

export function registerExpiryJob(): void {
  // 16:00 UTC = 00:00 PHT (UTC+8)
  schedule('0 16 * * *', async () => {
    try {
      const result = await User.updateMany(
        { subscriptionTier: 'pro', proEndsAt: { $lt: new Date() } },
        { $set: { subscriptionTier: 'starter', subscriptionStatus: 'active' } }
      )
      if (result.modifiedCount > 0) {
        console.log(`[expiry-job] Downgraded ${result.modifiedCount} expired Pro subscriptions`)
      }
    } catch (err) {
      console.error('[expiry-job] Error running Pro expiry job:', err)
    }
  })
  console.log('[expiry-job] Pro expiry cron job registered (runs at 16:00 UTC = midnight PHT)')
}
