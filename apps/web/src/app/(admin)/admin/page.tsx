import type { AdminStats, AdminRevenueMonth } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { StatCard } from '@/components/dashboard/StatCard'

export default async function AdminOverviewPage() {
  const [stats, revenue] = await Promise.all([
    serverApiFetch<AdminStats>('/api/v1/admin/stats'),
    serverApiFetch<AdminRevenueMonth[]>('/api/v1/admin/revenue'),
  ])

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Overview</h1>
      <p className="mt-1 text-sm text-text-secondary">Platform-wide snapshot</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard value={stats?.totalCoaches ?? 0} label="Total Coaches" />
        <StatCard value={stats?.activeTrials ?? 0} label="Active Trials" />
        <StatCard value={stats?.activeSubscriptions ?? 0} label="Active Subscriptions" />
      </div>

      <div className="mt-10">
        <h2 className="font-outfit text-xl font-semibold text-text-primary">Revenue by Month</h2>
        <p className="mt-1 mb-4 text-sm text-text-secondary">
          Approved upgrade requests · last 12 months
        </p>
        {(revenue?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted">No approved upgrades yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Month
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Approvals
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {(revenue ?? []).map((row, i) => (
                  <tr
                    key={row.month}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surface/50'}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{row.month}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{row.count}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-accent">
                      ₱{row.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
