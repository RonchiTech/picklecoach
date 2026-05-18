'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [consented, setConsented] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    try {
      await apiFetch('/api/v1/auth/register', { method: 'POST', body: { name, email, password } })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-text-secondary">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Coach Ron"
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>
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
          minLength={8}
          placeholder="Minimum 8 characters"
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="mt-0.5 shrink-0 accent-[#C8F135]"
          required
        />
        <span className="text-xs text-muted leading-relaxed">
          I have read and agree to the{' '}
          <a href="/privacy" target="_blank" className="text-accent hover:underline">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/terms" target="_blank" className="text-accent hover:underline">
            Terms of Service
          </a>
          .
        </span>
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        type="submit"
        disabled={loading || !consented}
        className="rounded-lg bg-accent py-2.5 font-semibold text-[#0C0C10] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
