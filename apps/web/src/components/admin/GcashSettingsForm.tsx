'use client'

import { useState, useRef } from 'react'
import type { PlatformSettingsGcash } from '@picklecoach/shared'

type Props = { current: PlatformSettingsGcash | null }

export function GcashSettingsForm({ current }: Props) {
  const [number, setNumber] = useState(current?.number ?? '')
  const [name, setName] = useState(current?.name ?? '')
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrPreview, setQrPreview] = useState<string | null>(current?.qrUrl ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setQrFile(file)
    if (file) setQrPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const form = new FormData()
      form.append('number', number)
      form.append('name', name)
      if (!qrFile && current?.qrUrl) form.append('qrUrl', current.qrUrl)
      if (qrFile) form.append('qr', qrFile)

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1/admin/settings/gcash`,
        { method: 'PUT', body: form, credentials: 'include' }
      ).then(async (r) => {
        if (!r.ok) {
          const body = (await r.json()) as { error?: { message?: string } }
          throw new Error(body.error?.message ?? 'Failed to save settings')
        }
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
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
          QR Code <span className="text-muted">(optional)</span>
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {qrPreview ? (
          <div className="flex items-center gap-4">
            <img
              src={qrPreview}
              alt="GCash QR Code"
              className="h-24 w-24 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-accent underline underline-offset-2 hover:opacity-80"
            >
              Change QR image
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-lg border border-dashed border-border bg-base px-4 py-6 text-center text-sm text-muted transition-colors hover:border-muted"
          >
            Click to upload QR image (JPG, PNG — max 2MB)
          </button>
        )}
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
