import type { AdminCoach, SubscriptionStatus, SubscriptionTier } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'

const TIER_LABEL: Record<SubscriptionTier, string> = {
  starter: 'Starter',
  pro: 'Pro',
  team: 'Team',
}

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active: 'bg-green-500/10 text-green-400',
  expired: 'bg-error/10 text-error',
  cancelled: 'bg-muted/10 text-muted',
}

export default async function AdminCoachesPage() {
  const coaches = await serverApiFetch<AdminCoach[]>('/api/v1/admin/coaches')

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Coaches</h1>
      <p className="mt-1 text-sm text-text-secondary">{coaches?.length ?? 0} registered coaches</p>

      <div className="mt-6 overflow-hidden rounded-lg border border-border">
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
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {TIER_LABEL[coach.subscriptionTier]}
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
              </tr>
            ))}
          </tbody>
        </table>
        {(coaches?.length ?? 0) === 0 && (
          <div className="px-4 py-12 text-center text-sm text-text-secondary">No coaches yet.</div>
        )}
      </div>
    </div>
  )
}
