'use client'

import { useState } from 'react'
import type { PublicCoachProfile } from '@picklecoach/shared'
import { SPECIALIZATIONS, AGE_GROUPS, LANGUAGES } from '@picklecoach/shared'
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

const AGE_LABELS: Record<string, string> = {
  kids: 'Kids',
  teens: 'Teens',
  adults: 'Adults',
  seniors: 'Seniors',
}

const LANG_LABELS: Record<string, string> = {
  filipino: 'Filipino',
  english: 'English',
  cebuano: 'Cebuano',
  ilocano: 'Ilocano',
  hiligaynon: 'Hiligaynon',
  bisaya: 'Bisaya',
}

function ProBadge() {
  return (
    <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-base uppercase tracking-wide">
      Pro
    </span>
  )
}

export function CoachingDetailsForm({
  profile,
  isPro,
}: {
  profile: PublicCoachProfile
  isPro: boolean
}) {
  const [specs, setSpecs] = useState<string[]>(profile.specializations)
  const [types, setTypes] = useState<string[]>(profile.sessionTypes)
  const [ageGroups, setAgeGroups] = useState<string[]>(profile.ageGroups ?? [])
  const [languages, setLanguages] = useState<string[]>(profile.languages ?? [])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((s) => s !== value) : [...list, value])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      const body: Record<string, unknown> = { specializations: specs, sessionTypes: types }
      if (isPro) {
        body.ageGroups = ageGroups
        body.languages = languages
      }
      await apiFetch('/api/v1/coach-profiles/me', { method: 'PATCH', body })
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
              onClick={() => toggle(specs, setSpecs, spec)}
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
              onClick={() => toggle(types, setTypes, type)}
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

      <div className="flex flex-col gap-2">
        <span className="flex items-center text-sm font-medium text-text-secondary">
          Age groups you coach
          {!isPro && <ProBadge />}
        </span>
        <div className="flex flex-wrap gap-2">
          {[...AGE_GROUPS].map((group) => (
            <button
              key={group}
              type="button"
              disabled={!isPro}
              onClick={() => toggle(ageGroups, setAgeGroups, group)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                ageGroups.includes(group)
                  ? 'bg-accent text-base'
                  : 'bg-surface border border-border text-text-secondary hover:border-accent'
              }`}
            >
              {AGE_LABELS[group]}
            </button>
          ))}
        </div>
        {!isPro && (
          <p className="text-xs text-text-secondary">
            Upgrade to Pro to set age group preferences.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="flex items-center text-sm font-medium text-text-secondary">
          Languages spoken
          {!isPro && <ProBadge />}
        </span>
        <div className="flex flex-wrap gap-2">
          {[...LANGUAGES].map((lang) => (
            <button
              key={lang}
              type="button"
              disabled={!isPro}
              onClick={() => toggle(languages, setLanguages, lang)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                languages.includes(lang)
                  ? 'bg-accent text-base'
                  : 'bg-surface border border-border text-text-secondary hover:border-accent'
              }`}
            >
              {LANG_LABELS[lang]}
            </button>
          ))}
        </div>
        {!isPro && (
          <p className="text-xs text-text-secondary">Upgrade to Pro to list spoken languages.</p>
        )}
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
