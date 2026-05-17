import type { DashboardStats } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { StatCard } from '@/components/dashboard/StatCard'
import { TrialBanner } from '@/components/dashboard/TrialBanner'

export default async function DashboardPage() {
  const stats = await serverApiFetch<DashboardStats>('/api/v1/dashboard/stats')

  const todaySessions = stats?.todaySessions ?? 0
  const totalStudents = stats?.totalStudents ?? 0
  const unpaidBalance = stats?.unpaidBalance ?? 0

  return (
    <div>
      <TrialBanner />
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-text-secondary">Your coaching overview</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard value={todaySessions} label="Sessions Today" />
        <StatCard value={totalStudents} label="Total Students" />
        <StatCard value={unpaidBalance} label="Unpaid Balance" prefix="₱" />
      </div>
    </div>
  )
}
