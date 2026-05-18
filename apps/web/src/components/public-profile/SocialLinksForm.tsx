'use client'

import { useState } from 'react'
import type { PublicCoachProfile } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

function ProBadge() {
  return (
    <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-base uppercase tracking-wide">
      Pro
    </span>
  )
}

export function SocialLinksForm({
  profile,
  isPro,
}: {
  profile: PublicCoachProfile
  isPro: boolean
}) {
  const [facebook, setFacebook] = useState(profile.socialLinks?.facebook ?? '')
  const [instagram, setInstagram] = useState(profile.socialLinks?.instagram ?? '')
  const [youtube, setYoutube] = useState(profile.socialLinks?.youtube ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      await apiFetch('/api/v1/coach-profiles/me', {
        method: 'PATCH',
        body: { socialLinks: { facebook, instagram, youtube } },
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-secondary focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isPro && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3">
          <ProBadge />
          <p className="text-sm text-text-secondary">
            Upgrade to Pro to display your social media links on your public profile.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="flex items-center text-sm font-medium text-text-secondary">
          Facebook page URL
          {!isPro && <ProBadge />}
        </label>
        <input
          type="url"
          value={facebook}
          onChange={(e) => setFacebook(e.target.value)}
          disabled={!isPro}
          placeholder="https://facebook.com/yourpage"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center text-sm font-medium text-text-secondary">
          Instagram profile URL
          {!isPro && <ProBadge />}
        </label>
        <input
          type="url"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          disabled={!isPro}
          placeholder="https://instagram.com/yourhandle"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center text-sm font-medium text-text-secondary">
          YouTube channel URL
          {!isPro && <ProBadge />}
        </label>
        <input
          type="url"
          value={youtube}
          onChange={(e) => setYoutube(e.target.value)}
          disabled={!isPro}
          placeholder="https://youtube.com/@yourchannel"
          className={inputClass}
        />
      </div>

      {error && <p className="text-error text-sm">{error}</p>}
      {success && <p className="text-success text-sm">Social links saved.</p>}

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
