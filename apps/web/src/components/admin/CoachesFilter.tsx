'use client'

import { useRouter } from 'next/navigation'
import type { SubscriptionStatus, SubscriptionTier } from '@picklecoach/shared'

const TIERS: SubscriptionTier[] = ['starter', 'pro', 'team']
const STATUSES: SubscriptionStatus[] = ['active', 'expired', 'cancelled']

export function CoachesFilter({
  currentTier,
  currentStatus,
}: {
  currentTier?: string
  currentStatus?: string
}) {
  const router = useRouter()

  const update = (key: 'tier' | 'status', value: string) => {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/admin/coaches?${params.toString()}`)
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <select
        value={currentTier ?? ''}
        onChange={(e) => update('tier', e.target.value)}
        className="rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
      >
        <option value="">All Tiers</option>
        {TIERS.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
      <select
        value={currentStatus ?? ''}
        onChange={(e) => update('status', e.target.value)}
        className="rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
      >
        <option value="">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      {(currentTier || currentStatus) && (
        <button
          onClick={() => router.push('/admin/coaches')}
          className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
