'use client'

import { useRef, useState } from 'react'
import type { PublicCoachProfile } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const INPUT_CLS =
  'w-full rounded-lg border border-border bg-base px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'
const LABEL_CLS = 'block text-sm font-medium text-text-secondary'

export function IdentityForm({ profile }: { profile: PublicCoachProfile }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await fetch(`${API_URL}/api/v1/coach-profiles/me/photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Upload failed')
      setPhotoUrl(data.data.photoUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setPhotoLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement)?.value ?? ''
    try {
      await apiFetch('/api/v1/coach-profiles/me', {
        method: 'PATCH',
        body: {
          displayName: getValue('displayName') || undefined,
          bio: getValue('bio') || undefined,
          city: getValue('city') || undefined,
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
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 flex-shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-2xl border border-border">
              👤
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">Profile photo</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoLoading}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {photoLoading ? 'Uploading…' : 'Choose file'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayName" className={LABEL_CLS}>
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={profile.displayName}
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className={LABEL_CLS}>
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile.bio ?? ''}
          placeholder="Tell students about your coaching style…"
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="city" className={LABEL_CLS}>
          City
        </label>
        <input
          id="city"
          name="city"
          type="text"
          defaultValue={profile.city ?? ''}
          placeholder="e.g. Makati, Metro Manila"
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
