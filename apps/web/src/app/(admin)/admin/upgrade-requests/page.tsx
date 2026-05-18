import type { PublicUpgradeRequest } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { UpgradeRequestList } from '@/components/admin/UpgradeRequestList'

export default async function AdminUpgradeRequestsPage() {
  const requests = (await serverApiFetch<PublicUpgradeRequest[]>('/api/v1/upgrade-requests')) ?? []

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-outfit text-3xl font-bold text-text-primary">Upgrade Requests</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review and approve Pro upgrade requests from coaches.
        </p>
      </div>
      <UpgradeRequestList requests={requests} />
    </div>
  )
}
