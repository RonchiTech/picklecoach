import type { AdminCoachDetail, SubscriptionStatus } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import Link from 'next/link'

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active: 'bg-green-500/10 text-green-400',
  expired: 'bg-error/10 text-error',
  cancelled: 'bg-muted/10 text-muted',
}

export default async function CoachDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const coach = await serverApiFetch<AdminCoachDetail>(`/api/v1/admin/coaches/${id}`)

  if (!coach) {
    return (
      <div>
        <Link
          href="/admin/coaches"
          className="mb-4 inline-flex items-center gap-1 text-xs text-text-secondary hover:text-accent"
        >
          ← Back to Coaches
        </Link>
        <p className="mt-4 text-sm text-error">Coach not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/coaches"
          className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-accent"
        >
          ← Back to Coaches
        </Link>
        <h1 className="mt-3 font-outfit text-3xl font-bold text-text-primary">{coach.name}</h1>
        <p className="mt-1 text-sm text-text-secondary">{coach.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-text-secondary">Tier</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold capitalize text-text-primary">
              {coach.subscriptionTier}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[coach.subscriptionStatus]}`}
            >
              {coach.subscriptionStatus}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-text-secondary">Students</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{coach.studentCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-text-secondary">Sessions</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{coach.sessionCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-text-secondary">Last Session</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            {coach.lastSessionAt
              ? new Date(coach.lastSessionAt).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '—'}
          </p>
        </div>
      </div>

      {coach.subscriptionTier === 'pro' && coach.proEndsAt && (
        <p className="text-sm text-text-secondary">
          Pro subscription ends:{' '}
          <span className="font-semibold text-text-primary">
            {new Date(coach.proEndsAt).toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </p>
      )}

      <div>
        <h2 className="mb-4 font-outfit text-lg font-semibold text-text-primary">
          Subscription History
        </h2>
        {coach.subscriptionHistory.length === 0 ? (
          <p className="text-sm text-muted">No approved upgrades yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Approved
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Discount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Promo
                  </th>
                </tr>
              </thead>
              <tbody>
                {coach.subscriptionHistory.map((h, i) => (
                  <tr
                    key={h._id}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surface/50'}`}
                  >
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {new Date(h.approvedAt).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {h.months} month{h.months > 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-accent">₱{h.amountDue}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {h.discountApplied > 0 ? `₱${h.discountApplied}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                      {h.promoCode ?? '—'}
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
