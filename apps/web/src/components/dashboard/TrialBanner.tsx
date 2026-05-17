'use client'

import { useEffect, useState } from 'react'
import type { SubscriptionInfo } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

export function TrialBanner() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null)

  useEffect(() => {
    apiFetch<{ success: true; data: SubscriptionInfo }>('/api/v1/subscriptions/me')
      .then((res) => setSub(res.data))
      .catch(() => {})
  }, [])

  if (!sub || sub.status !== 'trial') return null

  const inGrace = sub.daysRemaining === 0 && !sub.isLocked
  const graceDaysLeft = inGrace
    ? Math.ceil((new Date(sub.lockedAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : 0
  const urgent = sub.daysRemaining <= 7 || inGrace

  const message = inGrace
    ? `Trial ended — ${graceDaysLeft} day${graceDaysLeft === 1 ? '' : 's'} of grace period remaining`
    : `${sub.daysRemaining} day${sub.daysRemaining === 1 ? '' : 's'} left in your free trial`

  return (
    <div
      className={`mb-6 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
        urgent
          ? 'border-error bg-[#1a0d0d] text-error'
          : 'border-border bg-surface text-text-secondary'
      }`}
    >
      <span>{message}</span>
      <span className="ml-4 shrink-0 text-xs text-muted">Upgrade coming soon</span>
    </div>
  )
}
