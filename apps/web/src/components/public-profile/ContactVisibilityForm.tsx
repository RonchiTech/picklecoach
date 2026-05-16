'use client'

import { useState } from 'react'
import type { PublicCoachProfile } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-base px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'
const LABEL_CLS = 'block text-sm font-medium text-text-secondary'

export function ContactVisibilityForm({ profile }: { profile: PublicCoachProfile }) {
  const [showContact, setShowContact] = useState(profile.showContactInfo)
  const [isPublic, setIsPublic] = useState(profile.isPublic)
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
    try {
      await apiFetch('/api/v1/coach-profiles/me', {
        method: 'PATCH',
        body: {
          contactEmail: getValue('contactEmail') || undefined,
          contactPhone: getValue('contactPhone') || undefined,
          showContactInfo: showContact,
          isPublic,
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
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contactEmail" className={LABEL_CLS}>
          Contact email <span className="text-muted text-xs">(optional)</span>
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          defaultValue={profile.contactEmail ?? ''}
          placeholder="Shown on profile if enabled"
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contactPhone" className={LABEL_CLS}>
          Contact phone <span className="text-muted text-xs">(optional)</span>
        </label>
        <input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          defaultValue={profile.contactPhone ?? ''}
          placeholder="Shown on profile if enabled"
          className={INPUT_CLS}
        />
      </div>

      <div
        role="button"
        onClick={() => setShowContact((v) => !v)}
        className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-base px-4 py-3"
      >
        <div>
          <p className="text-sm font-medium text-text-primary">Show contact info publicly</p>
          <p className="text-xs text-muted">Display email/phone on your profile page</p>
        </div>
        <div
          className={`relative h-5 w-9 rounded-full transition-colors ${showContact ? 'bg-accent' : 'bg-border'}`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showContact ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </div>
      </div>

      <div
        role="button"
        onClick={() => setIsPublic((v) => !v)}
        className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-base px-4 py-3"
      >
        <div>
          <p className="text-sm font-medium text-text-primary">List me in the coach directory</p>
          <p className="text-xs text-muted">Makes your profile discoverable at /coaches</p>
        </div>
        <div
          className={`relative h-5 w-9 rounded-full transition-colors ${isPublic ? 'bg-accent' : 'bg-border'}`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
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
