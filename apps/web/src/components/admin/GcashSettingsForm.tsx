'use client'

import { useState } from 'react'
import type { PlatformSettingsGcash } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

type Props = { current: PlatformSettingsGcash | null }

export function GcashSettingsForm({ current }: Props) {
  const [number, setNumber] = useState(current?.number ?? '')
  const [name, setName] = useState(current?.name ?? '')
  const [qrUrl, setQrUrl] = useState(current?.qrUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await apiFetch('/api/v1/admin/settings/gcash', {
        method: 'PUT',
        body: JSON.stringify({ number, name, qrUrl: qrUrl || undefined }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">GCash Number</label>
        <input
          type="text"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="09XXXXXXXXX"
          required
          className="w-full rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">Account Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Juan Dela Cruz"
          required
          className="w-full rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">
          QR Code URL <span className="text-muted">(optional)</span>
        </label>
        <input
          type="url"
          value={qrUrl}
          onChange={(e) => setQrUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-[#0C0C10] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save settings'}
      </button>
    </form>
  )
}
