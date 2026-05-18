import type { DashboardStats, PublicUser } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { StatCard } from '@/components/dashboard/StatCard'
import { UpgradeBanner } from '@/components/dashboard/UpgradeBanner'

export default async function DashboardPage() {
  const [stats, user] = await Promise.all([
    serverApiFetch<DashboardStats>('/api/v1/dashboard/stats'),
    serverApiFetch<PublicUser>('/api/v1/auth/me'),
  ])

  return (
    <div>
      {user?.subscriptionTier === 'starter' && <UpgradeBanner />}
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-text-secondary">Your coaching overview</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard value={stats?.todaySessions ?? 0} label="Sessions Today" />
        <StatCard value={stats?.totalStudents ?? 0} label="Total Students" />
        <StatCard value={stats?.unpaidBalance ?? 0} label="Unpaid Balance" prefix="₱" />
      </div>
    </div>
  )
}
