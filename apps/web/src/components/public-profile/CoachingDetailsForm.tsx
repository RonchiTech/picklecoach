'use client'

import { useState } from 'react'
import type { PublicCoachProfile } from '@picklecoach/shared'
import { SPECIALIZATIONS } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const SPEC_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  dinking: 'Dinking',
  serve: 'Serve',
  '3rd-shot-drop': '3rd Shot Drop',
  footwork: 'Footwork',
  strategy: 'Strategy',
  doubles: 'Doubles',
  singles: 'Singles',
}

export function CoachingDetailsForm({ profile }: { profile: PublicCoachProfile }) {
  const [specs, setSpecs] = useState<string[]>(profile.specializations)
  const [types, setTypes] = useState<string[]>(profile.sessionTypes)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function toggleSpec(value: string) {
    setSpecs((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]))
  }

  function toggleType(value: string) {
    setTypes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      await apiFetch('/api/v1/coach-profiles/me', {
        method: 'PATCH',
        body: { specializations: specs, sessionTypes: types },
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
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-secondary">Specializations</span>
        <div className="flex flex-wrap gap-2">
          {[...SPECIALIZATIONS].map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => toggleSpec(spec)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                specs.includes(spec)
                  ? 'bg-accent text-base'
                  : 'bg-surface border border-border text-text-secondary hover:border-accent'
              }`}
            >
              {SPEC_LABELS[spec]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-secondary">Session types offered</span>
        <div className="flex gap-2">
          {(['private', 'group'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                types.includes(type)
                  ? 'bg-accent text-base'
                  : 'bg-surface border border-border text-text-secondary hover:border-accent'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}
      {success && <p className="text-success text-sm">Changes saved.</p>}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-base disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
