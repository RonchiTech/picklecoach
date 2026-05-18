'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminCoach, SubscriptionTier } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const TIERS: SubscriptionTier[] = ['starter', 'pro', 'team']
const TIER_LABEL: Record<SubscriptionTier, string> = {
  starter: 'Starter',
  pro: 'Pro',
  team: 'Team',
}

export function SubscriptionManager({ coach }: { coach: AdminCoach }) {
  const [tier, setTier] = useState<SubscriptionTier>(coach.subscriptionTier)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    setError(null)
    try {
      await apiFetch(`/api/v1/admin/coaches/${coach._id}/subscription`, {
        method: 'PATCH',
        body: { tier },
      })
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          value={tier}
          onChange={(e) => {
            setTier(e.target.value as SubscriptionTier)
            setSaved(false)
          }}
          className="rounded-md border border-border bg-base px-2 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
        >
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {TIER_LABEL[t]}
            </option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={loading || tier === coach.subscriptionTier}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-base disabled:opacity-50"
        >
          {loading ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
