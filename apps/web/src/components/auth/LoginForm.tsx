'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    try {
      await apiFetch('/api/v1/auth/login', { method: 'POST', body: { email, password } })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
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
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-text-secondary">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
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
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
