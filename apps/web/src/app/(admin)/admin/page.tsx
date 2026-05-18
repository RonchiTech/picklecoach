import type {
  AdminChurned,
  AdminExpiringSoon,
  AdminRevenueMonth,
  AdminStats,
} from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { StatCard } from '@/components/dashboard/StatCard'
import Link from 'next/link'

export default async function AdminOverviewPage() {
  const [stats, revenue, expiring, churned] = await Promise.all([
    serverApiFetch<AdminStats>('/api/v1/admin/stats'),
    serverApiFetch<AdminRevenueMonth[]>('/api/v1/admin/revenue'),
    serverApiFetch<AdminExpiringSoon[]>('/api/v1/admin/coaches/expiring'),
    serverApiFetch<AdminChurned[]>('/api/v1/admin/coaches/churned'),
  ])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-outfit text-3xl font-bold text-text-primary">Overview</h1>
        <p className="mt-1 text-sm text-text-secondary">Platform-wide snapshot</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard value={stats?.totalCoaches ?? 0} label="Total Coaches" />
        <StatCard value={stats?.activeTrials ?? 0} label="Active Trials" />
        <StatCard value={stats?.activeSubscriptions ?? 0} label="Active Subscriptions" />
      </div>

      <div>
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

      <div>
        <h2 className="font-outfit text-xl font-semibold text-text-primary">Expiring Soon</h2>
        <p className="mt-1 mb-4 text-sm text-text-secondary">
          Pro coaches whose subscription ends within 14 days
        </p>
        {(expiring?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted">No coaches expiring soon.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Coach
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Days Left
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {(expiring ?? []).map((c, i) => (
                  <tr
                    key={c._id}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surface/50'}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{c.email}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {new Date(c.proEndsAt).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          c.daysLeft <= 3
                            ? 'bg-error/10 text-error'
                            : c.daysLeft <= 7
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-muted/10 text-muted'
                        }`}
                      >
                        {c.daysLeft}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/coaches/${c._id}`}
                        className="text-xs text-text-secondary hover:text-accent"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-outfit text-xl font-semibold text-text-primary">Churn</h2>
        <p className="mt-1 mb-4 text-sm text-text-secondary">
          Coaches who previously upgraded but are now on Starter
        </p>
        {(churned?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted">No churned coaches.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Coach
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Last Approved
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {(churned ?? []).map((c, i) => (
                  <tr
                    key={c._id}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surface/50'}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{c.email}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {new Date(c.lastApprovedAt).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/coaches/${c._id}`}
                        className="text-xs text-text-secondary hover:text-accent"
                      >
                        View →
                      </Link>
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
