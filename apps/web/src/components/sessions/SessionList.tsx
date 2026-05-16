'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublicSession, PublicStudent } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

type SessionListProps = {
  sessions: PublicSession[]
  studentMap: Record<string, PublicStudent>
}

const STATUS_PILL: Record<string, string> = {
  scheduled: 'bg-accent/15 text-accent',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-error/15 text-error',
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function SessionList({ sessions, studentMap }: SessionListProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function updateStatus(id: string, status: 'completed' | 'cancelled') {
    setLoadingId(id)
    try {
      await apiFetch(`/api/v1/sessions/${id}`, { method: 'PATCH', body: { status } })
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted">
        No sessions yet.{' '}
        <a href="/dashboard/sessions/new" className="text-accent hover:underline">
          Schedule one
        </a>
        .
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {sessions.map((s) => {
        const names = s.studentIds.map((id) => studentMap[id]?.name ?? 'Unknown').join(', ')
        const pill = STATUS_PILL[s.status] ?? 'bg-muted/20 text-muted'
        const busy = loadingId === s._id

        return (
          <li
            key={s._id}
            className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex flex-col gap-1">
              <p className="font-medium text-text-primary">{names}</p>
              <p className="text-sm text-text-secondary">{formatDateTime(s.scheduledAt)}</p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${pill}`}
                >
                  {s.status}
                </span>
                <span className="text-xs text-muted capitalize">{s.type}</span>
                <span className="text-xs text-muted">{formatDuration(s.durationMinutes)}</span>
              </div>
              {s.notes && <p className="mt-1 text-xs text-muted">{s.notes}</p>}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={`/dashboard/sessions/${s._id}/edit`}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-text-secondary hover:text-text-primary"
              >
                Edit
              </a>
              {s.status === 'scheduled' && (
                <>
                  <button
                    onClick={() => updateStatus(s._id, 'completed')}
                    disabled={busy}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-base hover:opacity-90 disabled:opacity-50"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => updateStatus(s._id, 'cancelled')}
                    disabled={busy}
                    className="rounded-lg border border-error/50 px-3 py-1.5 text-xs text-error hover:border-error disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
