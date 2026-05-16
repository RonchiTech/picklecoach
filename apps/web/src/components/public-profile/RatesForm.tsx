'use client'

import { useState } from 'react'
import type { PublicCoachProfile } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-base px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'
const LABEL_CLS = 'block text-sm font-medium text-text-secondary'

export function RatesForm({ profile }: { profile: PublicCoachProfile }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement)?.value ?? ''
    const privateRateStr = getValue('privateRate')
    const groupRateStr = getValue('groupRate')
    try {
      await apiFetch('/api/v1/coach-profiles/me', {
        method: 'PATCH',
        body: {
          privateRate: privateRateStr ? Number(privateRateStr) : undefined,
          groupRate: groupRateStr ? Number(groupRateStr) : undefined,
          ratesNote: getValue('ratesNote') || undefined,
        },
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
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="privateRate" className={LABEL_CLS}>
            Private rate (PHP)
          </label>
          <input
            id="privateRate"
            name="privateRate"
            type="number"
            min={0}
            defaultValue={profile.privateRate ?? ''}
            placeholder="e.g. 1500"
            className={INPUT_CLS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="groupRate" className={LABEL_CLS}>
            Group rate (PHP)
          </label>
          <input
            id="groupRate"
            name="groupRate"
            type="number"
            min={0}
            defaultValue={profile.groupRate ?? ''}
            placeholder="e.g. 800"
            className={INPUT_CLS}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ratesNote" className={LABEL_CLS}>
          Rates note <span className="text-muted text-xs">(optional)</span>
        </label>
        <input
          id="ratesNote"
          name="ratesNote"
          type="text"
          defaultValue={profile.ratesNote ?? ''}
          placeholder="e.g. packages available"
          className={INPUT_CLS}
        />
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
