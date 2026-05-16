'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { SPECIALIZATIONS } from '@picklecoach/shared'

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

const SELECT_CLASS =
  'rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent'

export function CoachFilters() {
  const router = useRouter()
  const params = useSearchParams()

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    next.delete('page')
    router.push(`/coaches?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={params.get('specialization') ?? ''}
        onChange={(e) => update('specialization', e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">All Specializations</option>
        {[...SPECIALIZATIONS].map((s) => (
          <option key={s} value={s}>
            {SPEC_LABELS[s]}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="City"
        defaultValue={params.get('city') ?? ''}
        onBlur={(e) => update('city', e.target.value.trim())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') update('city', (e.target as HTMLInputElement).value.trim())
        }}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent"
      />

      <select
        value={params.get('sessionType') ?? ''}
        onChange={(e) => update('sessionType', e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">All Session Types</option>
        <option value="private">Private</option>
        <option value="group">Group</option>
      </select>
    </div>
  )
}
