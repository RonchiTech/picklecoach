import type { AdminCoach, SubscriptionStatus } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { CoachTierEditor } from '@/components/admin/CoachTierEditor'
import { CoachesFilter } from '@/components/admin/CoachesFilter'
import Link from 'next/link'

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active: 'bg-green-500/10 text-green-400',
  expired: 'bg-error/10 text-error',
  cancelled: 'bg-muted/10 text-muted',
}

export default async function AdminCoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; status?: string }>
}) {
  const { tier, status } = await searchParams
  const qs = new URLSearchParams()
  if (tier) qs.set('tier', tier)
  if (status) qs.set('status', status)
  const query = qs.toString()

  const coaches = await serverApiFetch<AdminCoach[]>(
    `/api/v1/admin/coaches${query ? `?${query}` : ''}`
  )

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Coaches</h1>
      <p className="mt-1 text-sm text-text-secondary">{coaches?.length ?? 0} coaches</p>

      <CoachesFilter currentTier={tier} currentStatus={status} />

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Tier
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Joined
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(coaches ?? []).map((coach, i) => (
              <tr
                key={coach._id}
                className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surface/50'}`}
              >
                <td className="px-4 py-3 text-sm font-medium text-text-primary">{coach.name}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">{coach.email}</td>
                <td className="px-4 py-3">
                  <CoachTierEditor coachId={coach._id} currentTier={coach.subscriptionTier} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[coach.subscriptionStatus]}`}
                  >
                    {coach.subscriptionStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {new Date(coach.createdAt).toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/coaches/${coach._id}`}
                    className="text-xs text-text-secondary hover:text-accent"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(coaches?.length ?? 0) === 0 && (
          <div className="px-4 py-12 text-center text-sm text-text-secondary">
            No coaches found.
          </div>
        )}
      </div>
    </div>
  )
}
