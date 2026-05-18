import type { PlatformSettingsGcash, PublicUpgradeRequest } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { UpgradeForm } from '@/components/upgrade/UpgradeForm'

export default async function UpgradePage() {
  const [gcash, latestRequest] = await Promise.all([
    serverApiFetch<PlatformSettingsGcash>('/api/v1/settings/gcash'),
    serverApiFetch<PublicUpgradeRequest | null>('/api/v1/upgrade-requests/mine'),
  ])

  const hasPending = latestRequest?.status === 'pending'

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="font-outfit text-3xl font-bold text-text-primary">Upgrade to Pro</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Unlock student progress tracking and more advanced coaching tools.
        </p>
      </div>

      <UpgradeForm gcash={gcash} hasPending={hasPending} />
    </div>
  )
}
