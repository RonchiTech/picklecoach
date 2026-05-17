'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

const ENTRY_TYPES = [
  { value: 'general', label: 'Note' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'goal', label: 'Goal' },
  { value: 'milestone', label: 'Milestone' },
] as const

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'

type Props = { studentId: string }

export function AddProgressEntry({ studentId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [entryType, setEntryType] = useState('general')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const skillTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      await apiFetch('/api/v1/progress-entries', {
        method: 'POST',
        body: { studentId, type: entryType, content, skillTags },
      })
      setContent('')
      setTags('')
      setEntryType('general')
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-[#0C0C10] transition-opacity hover:opacity-90"
      >
        + Add entry
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5"
    >
      <div className="flex items-center gap-3">
        <label className="w-12 shrink-0 text-xs font-medium text-text-secondary">Type</label>
        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value)}
          className={INPUT_CLS}
        >
          {ENTRY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <label className="w-12 shrink-0 pt-2.5 text-xs font-medium text-text-secondary">Note</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          required
          placeholder="Describe the observation, goal, or milestone..."
          className={INPUT_CLS}
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="w-12 shrink-0 text-xs font-medium text-text-secondary">Tags</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="dinking, footwork, serve (comma-separated)"
          className={INPUT_CLS}
        />
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-text-secondary hover:text-text-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-[#0C0C10] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save entry'}
        </button>
      </div>
    </form>
  )
}
