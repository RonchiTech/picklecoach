'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublicStudent } from '@picklecoach/shared'
import { REFERRAL_SOURCES } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const REFERRAL_LABELS: Record<string, string> = {
  'word-of-mouth': 'Word of mouth',
  'social-media': 'Social media',
  directory: 'Coach directory',
  friend: 'Friend referral',
  other: 'Other',
}

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'elite', label: 'Elite' },
] as const

type StudentFormProps = {
  student?: PublicStudent
}

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'
const LABEL_CLS = 'block text-sm font-medium text-text-secondary'

export function StudentForm({ student }: StudentFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isEdit = !!student

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
        .value

    const body = {
      name: getValue('name'),
      email: getValue('email') || undefined,
      phone: getValue('phone') || undefined,
      skillLevel: getValue('skillLevel'),
      notes: getValue('notes') || undefined,
      referralSource: getValue('referralSource') || undefined,
    }

    try {
      const path = isEdit ? `/api/v1/students/${student._id}` : '/api/v1/students'
      const method = isEdit ? 'PATCH' : 'POST'
      await apiFetch(path, { method, body })
      router.push('/dashboard/students')
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
        <label htmlFor="name" className={LABEL_CLS}>
          Full name <span className="text-error">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={student?.name}
          placeholder="e.g. Juan dela Cruz"
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="skillLevel" className={LABEL_CLS}>
          Skill level
        </label>
        <select
          id="skillLevel"
          name="skillLevel"
          defaultValue={student?.skillLevel ?? 'beginner'}
          className={INPUT_CLS}
        >
          {SKILL_LEVELS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={LABEL_CLS}>
          Email <span className="text-muted">(optional)</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={student?.email}
          placeholder="student@example.com"
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className={LABEL_CLS}>
          Phone <span className="text-muted">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          defaultValue={student?.phone}
          placeholder="09171234567"
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="referralSource" className={LABEL_CLS}>
          How did they find you? <span className="text-muted">(optional)</span>
        </label>
        <select
          id="referralSource"
          name="referralSource"
          defaultValue={student?.referralSource ?? ''}
          className={INPUT_CLS}
        >
          <option value="">— Select —</option>
          {REFERRAL_SOURCES.map((src) => (
            <option key={src} value={src}>
              {REFERRAL_LABELS[src] ?? src}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className={LABEL_CLS}>
          Notes <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={student?.notes}
          placeholder="Anything you want to remember about this student"
          className={INPUT_CLS}
        />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add student'}
        </button>
        <a
          href="/dashboard/students"
          className="rounded-lg border border-border px-6 py-2.5 text-sm text-text-secondary transition-colors hover:border-text-secondary hover:text-text-primary"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
