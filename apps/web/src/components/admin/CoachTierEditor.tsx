'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SubscriptionTier } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const TIERS: SubscriptionTier[] = ['starter', 'pro', 'team']

type Props = {
  coachId: string
  currentTier: SubscriptionTier
}

export function CoachTierEditor({ coachId, currentTier }: Props) {
  const router = useRouter()
  const [tier, setTier] = useState<SubscriptionTier>(currentTier)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const isDirty = tier !== currentTier

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await apiFetch(`/api/v1/admin/coaches/${coachId}/subscription`, {
        method: 'PATCH',
        body: { tier },
      })
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={tier}
        onChange={(e) => {
          setTier(e.target.value as SubscriptionTier)
          setSaved(false)
          setError('')
        }}
        className="rounded border border-border bg-base px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
      >
        {TIERS.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
      {isDirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-accent px-2 py-1 text-xs font-semibold text-[#0C0C10] disabled:opacity-40"
        >
          {saving ? '…' : 'Save'}
        </button>
      )}
      {saved && <span className="text-xs text-green-400">✓</span>}
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
}
