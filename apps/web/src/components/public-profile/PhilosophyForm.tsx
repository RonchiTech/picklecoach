'use client'

import { useState } from 'react'
import type { PublicCoachProfile } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const MAX_CHARS = 300

function ProBadge() {
  return (
    <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-base uppercase tracking-wide">
      Pro
    </span>
  )
}

export function PhilosophyForm({
  profile,
  isPro,
}: {
  profile: PublicCoachProfile
  isPro: boolean
}) {
  const [text, setText] = useState(profile.coachingPhilosophy ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const remaining = MAX_CHARS - text.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      await apiFetch('/api/v1/coach-profiles/me', {
        method: 'PATCH',
        body: { coachingPhilosophy: text },
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isPro && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3">
          <ProBadge />
          <p className="text-sm text-text-secondary">
            Upgrade to Pro to share your coaching philosophy with potential students.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="flex items-center text-sm font-medium text-text-secondary">
          Coaching philosophy
          {!isPro && <ProBadge />}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          disabled={!isPro}
          rows={4}
          placeholder="Share what drives your coaching style and philosophy…"
          className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-secondary focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        />
        <p
          className={`text-right text-xs ${remaining < 20 ? 'text-warning' : 'text-text-secondary'}`}
        >
          {remaining} characters remaining
        </p>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}
      {success && <p className="text-success text-sm">Philosophy saved.</p>}

      <div>
        <button
          type="submit"
          disabled={loading || !isPro}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-base disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
