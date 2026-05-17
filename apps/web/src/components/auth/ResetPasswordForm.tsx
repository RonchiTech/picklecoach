'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

export function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-error">
          Invalid or missing reset link. Please request a new one.
        </p>
        <Link href="/forgot-password" className="text-sm text-accent hover:underline">
          Request a new reset link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const newPassword = (e.currentTarget.elements.namedItem('newPassword') as HTMLInputElement)
      .value
    try {
      await apiFetch('/api/v1/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword },
      })
      router.push('/login?reset=success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className="text-sm font-medium text-text-secondary">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          placeholder="••••••••"
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent py-2.5 font-semibold text-[#0C0C10] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Updating…' : 'Set new password'}
      </button>
    </form>
  )
}
