'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublicUpgradeRequest } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const STATUS_COLORS = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  approved: 'text-accent bg-accent/10',
  rejected: 'text-error bg-error/10',
}

type Props = { requests: PublicUpgradeRequest[] }

export function UpgradeRequestList({ requests }: Props) {
  const router = useRouter()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const review = async (id: string, action: 'approved' | 'rejected') => {
    setLoading((p) => ({ ...p, [id]: true }))
    try {
      await apiFetch(`/api/v1/upgrade-requests/${id}/review`, {
        method: 'PATCH',
        body: { action, notes: notes[id] },
      })
      router.refresh()
    } finally {
      setLoading((p) => ({ ...p, [id]: false }))
    }
  }

  if (requests.length === 0) {
    return <p className="text-sm text-text-secondary">No upgrade requests yet.</p>
  }

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <div key={r._id} className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-text-primary">{r.coachName}</p>
              <p className="text-xs text-text-secondary">{r.coachEmail}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[r.status]}`}
            >
              {r.status}
            </span>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-3 text-xs text-muted">
            <div>
              <span className="block font-medium text-text-secondary">Duration</span>
              {r.months} month{r.months > 1 ? 's' : ''}
            </div>
            <div>
              <span className="block font-medium text-text-secondary">Amount</span>₱{r.amountDue}
            </div>
            <div>
              <span className="block font-medium text-text-secondary">Promo</span>
              {r.promoCode ?? '—'}
            </div>
          </div>

          <a
            href={r.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 inline-block text-xs text-accent underline underline-offset-2 hover:opacity-80"
          >
            View receipt →
          </a>

          {r.status === 'pending' && (
            <div className="space-y-2 border-t border-border pt-3">
              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes[r._id] ?? ''}
                onChange={(e) => setNotes((p) => ({ ...p, [r._id]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-base px-3 py-1.5 text-xs text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => review(r._id, 'approved')}
                  disabled={loading[r._id]}
                  className="flex-1 rounded-lg bg-accent py-1.5 text-xs font-bold text-[#0C0C10] transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {loading[r._id] ? '...' : 'Approve'}
                </button>
                <button
                  onClick={() => review(r._id, 'rejected')}
                  disabled={loading[r._id]}
                  className="flex-1 rounded-lg border border-error py-1.5 text-xs font-bold text-error transition-colors hover:bg-error/5 disabled:opacity-40"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {r.status !== 'pending' && r.notes && (
            <p className="mt-2 border-t border-border pt-2 text-xs text-muted">Notes: {r.notes}</p>
          )}
        </div>
      ))}
    </div>
  )
}
