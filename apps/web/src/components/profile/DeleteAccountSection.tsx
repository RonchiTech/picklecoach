'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export function DeleteAccountSection() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (confirmation !== 'DELETE') return
    setLoading(true)
    setError(null)
    try {
      await apiFetch('/api/v1/auth/account', { method: 'DELETE' })
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account.')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-red-900/40 bg-surface p-5">
      <h2 className="mb-1 text-sm font-semibold text-red-400">Danger zone</h2>
      <p className="mb-4 text-xs text-muted leading-relaxed">
        Permanently delete your account and all associated data — students, sessions, payments, your
        coach profile, and subscription history. This cannot be undone.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-red-900/60 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/20 transition-colors"
        >
          Delete my account
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted">
            Type <strong className="text-white">DELETE</strong> to confirm:
          </p>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            className="rounded-lg border border-red-900/60 bg-base px-4 py-2.5 text-sm text-text-primary placeholder:text-muted focus:border-red-500 focus:outline-none"
          />
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={confirmation !== 'DELETE' || loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-40"
            >
              {loading ? 'Deleting…' : 'Permanently delete account'}
            </button>
            <button
              onClick={() => {
                setOpen(false)
                setConfirmation('')
                setError(null)
              }}
              className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
