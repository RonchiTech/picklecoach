import type { AdminStats } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { StatCard } from '@/components/dashboard/StatCard'

export default async function AdminOverviewPage() {
  const stats = await serverApiFetch<AdminStats>('/api/v1/admin/stats')

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Overview</h1>
      <p className="mt-1 text-sm text-text-secondary">Platform-wide snapshot</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard value={stats?.totalCoaches ?? 0} label="Total Coaches" />
        <StatCard value={stats?.activeTrials ?? 0} label="Active Trials" />
        <StatCard value={stats?.activeSubscriptions ?? 0} label="Active Subscriptions" />
      </div>
    </div>
  )
}
