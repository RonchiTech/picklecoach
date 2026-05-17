'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value
    try {
      await apiFetch('/api/v1/auth/forgot-password', { method: 'POST', body: { email } })
    } catch {
      // always show success — never reveal whether email exists
    } finally {
      setSubmitted(true)
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <p className="text-sm text-text-secondary">
        If that email is registered, you&apos;ll receive a reset link shortly. Check your inbox.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-text-secondary">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent py-2.5 font-semibold text-[#0C0C10] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
