'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { ApplyPromoResult } from '@picklecoach/shared'

export function ApplyPromoForm() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await apiFetch<{ success: boolean; data: ApplyPromoResult }>(
        '/api/v1/promotions/apply',
        { method: 'POST', body: { code } }
      )
      setSuccess(`Code applied! Your account has been upgraded to ${res.data.tier}.`)
      setCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter promo code"
          className="flex-1 rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-base disabled:opacity-50"
        >
          {loading ? 'Applying…' : 'Apply'}
        </button>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      {success && <p className="text-sm text-accent">{success}</p>}
    </form>
  )
}
