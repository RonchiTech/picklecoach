'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublicProgressEntry, ProgressEntryType } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const TYPE_LABEL: Record<ProgressEntryType, string> = {
  general: 'Note',
  assessment: 'Assessment',
  goal: 'Goal',
  milestone: 'Milestone',
}

const TYPE_DOT: Record<ProgressEntryType, string> = {
  general: 'bg-border',
  assessment: 'bg-text-secondary',
  goal: 'bg-accent/60',
  milestone: 'bg-accent',
}

const TYPE_LABEL_CLS: Record<ProgressEntryType, string> = {
  general: 'text-muted',
  assessment: 'text-text-secondary',
  goal: 'text-accent/80',
  milestone: 'text-accent',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

type Props = { entries: PublicProgressEntry[] }

export function ProgressTimeline({ entries }: Props) {
  const router = useRouter()
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = [...new Set(entries.flatMap((e) => e.skillTags))]

  const filtered =
    selectedTags.length === 0
      ? entries
      : entries.filter((e) => selectedTags.some((t) => e.skillTags.includes(t)))

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    await apiFetch(`/api/v1/progress-entries/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted">No progress entries yet.</p>
        <p className="mt-1 text-xs text-muted">Add the first entry above.</p>
      </div>
    )
  }

  return (
    <div>
      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-accent font-semibold text-[#0C0C10]'
                  : 'border border-border text-muted hover:border-accent hover:text-accent'
              }`}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="text-xs text-muted transition-colors hover:text-text-primary"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      <div>
        {filtered.map((entry, i) => (
          <div key={entry._id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${TYPE_DOT[entry.type]}`} />
              {i < filtered.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
            </div>

            <div className="min-w-0 flex-1 pb-8">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`text-xs font-semibold uppercase tracking-wide ${TYPE_LABEL_CLS[entry.type]}`}
                >
                  {TYPE_LABEL[entry.type]}
                </span>
                <span className="text-xs text-muted">{formatDate(entry.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                {entry.content}
              </p>
              {entry.skillTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.skillTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => handleDelete(entry._id)}
                className="mt-2 text-[10px] text-muted transition-colors hover:text-error"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
