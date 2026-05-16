'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublicSession, PublicStudent } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

type SessionFormProps = {
  students: PublicStudent[]
  session?: PublicSession
}

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'
const LABEL_CLS = 'block text-sm font-medium text-text-secondary'

function toLocalDatetimeValue(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SessionForm({ students, session }: SessionFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isEdit = !!session

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const data = new FormData(form)
    const studentIds = data.getAll('studentIds') as string[]
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement).value

    const scheduledLocal = getValue('scheduledAt')
    const scheduledAt = scheduledLocal ? new Date(scheduledLocal).toISOString() : ''

    const body = {
      studentIds,
      type: getValue('type'),
      scheduledAt,
      durationMinutes: Number(getValue('durationMinutes')),
      notes: getValue('notes') || undefined,
      ...(isEdit ? { status: getValue('status') } : {}),
    }

    try {
      const path = isEdit ? `/api/v1/sessions/${session._id}` : '/api/v1/sessions'
      const method = isEdit ? 'PATCH' : 'POST'
      await apiFetch(path, { method, body })
      router.push('/dashboard/sessions')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <span className={LABEL_CLS}>
          Students <span className="text-error">*</span>
        </span>
        {students.length === 0 ? (
          <p className="text-sm text-muted">No students yet. Add students first.</p>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
            {students.map((s) => {
              const checked = session?.studentIds.includes(s._id)
              return (
                <label key={s._id} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    name="studentIds"
                    value={s._id}
                    defaultChecked={checked}
                    className="h-4 w-4 rounded accent-accent"
                  />
                  <span className="text-sm text-text-primary">{s.name}</span>
                  <span className="text-xs text-muted capitalize">{s.skillLevel}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="type" className={LABEL_CLS}>
          Session type
        </label>
        <select
          id="type"
          name="type"
          defaultValue={session?.type ?? 'private'}
          className={INPUT_CLS}
        >
          <option value="private">Private (1-on-1)</option>
          <option value="group">Group</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="scheduledAt" className={LABEL_CLS}>
          Date &amp; time <span className="text-error">*</span>
        </label>
        <input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          required
          defaultValue={toLocalDatetimeValue(session?.scheduledAt)}
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="durationMinutes" className={LABEL_CLS}>
          Duration
        </label>
        <select
          id="durationMinutes"
          name="durationMinutes"
          defaultValue={session?.durationMinutes ?? 60}
          className={INPUT_CLS}
        >
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>1 hour</option>
          <option value={90}>1.5 hours</option>
          <option value={120}>2 hours</option>
        </select>
      </div>

      {isEdit && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className={LABEL_CLS}>
            Status
          </label>
          <select id="status" name="status" defaultValue={session.status} className={INPUT_CLS}>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className={LABEL_CLS}>
          Notes <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={session?.notes}
          placeholder="Drills, feedback, anything to remember"
          className={INPUT_CLS}
        />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || students.length === 0}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Schedule session'}
        </button>
        <a
          href="/dashboard/sessions"
          className="rounded-lg border border-border px-6 py-2.5 text-sm text-text-secondary transition-colors hover:border-text-secondary hover:text-text-primary"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
