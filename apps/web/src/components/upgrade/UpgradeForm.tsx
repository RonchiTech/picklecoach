'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ValidatePromoResult, PlatformSettingsGcash } from '@picklecoach/shared'
import { BUNDLE_PRICES as PRICES } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const BUNDLE_OPTIONS = [
  { months: 1, label: '1 month' },
  { months: 3, label: '3 months', badge: 'Save ₱48' },
  { months: 6, label: '6 months', badge: 'Save ₱144' },
  { months: 12, label: '12 months', badge: 'Save ₱298' },
]

type Props = {
  gcash: PlatformSettingsGcash | null
  hasPending: boolean
}

export function UpgradeForm({ gcash, hasPending }: Props) {
  const router = useRouter()
  const [months, setMonths] = useState(1)
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState<ValidatePromoResult | null>(null)
  const [promoError, setPromoError] = useState('')
  const [validating, setValidating] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (hasPending) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="mb-1 text-sm font-semibold text-text-primary">Request pending review</p>
        <p className="text-xs text-text-secondary">
          Your upgrade request has been submitted. We&apos;ll activate your Pro account within 24
          hours after verifying your payment.
        </p>
      </div>
    )
  }

  if (!gcash) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-sm text-text-secondary">
          Payment details are not yet configured. Please check back soon or contact support.
        </p>
      </div>
    )
  }

  const base = PRICES[months] ?? 149
  const finalAmount = promoResult?.finalAmount ?? base

  const handleValidatePromo = async () => {
    if (!promoCode) return
    setValidating(true)
    setPromoError('')
    setPromoResult(null)
    try {
      const res = await apiFetch<{ success: true; data: ValidatePromoResult }>(
        '/api/v1/promotions/validate',
        { method: 'POST', body: JSON.stringify({ code: promoCode, months }) }
      )
      setPromoResult(res.data)
    } catch {
      setPromoError('Invalid or expired promo code')
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setSubmitError('Please upload your GCash receipt')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const form = new FormData()
      form.append('months', String(months))
      if (promoCode && promoResult) form.append('promoCode', promoCode)
      form.append('receipt', file)

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1/upgrade-requests`,
        { method: 'POST', body: form, credentials: 'include' }
      ).then(async (r) => {
        if (!r.ok) {
          const body = (await r.json()) as { error?: { message?: string } }
          throw new Error(body.error?.message ?? 'Submission failed')
        }
      })
      router.refresh()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Month selector */}
      <div>
        <p className="mb-3 text-sm font-semibold text-text-primary">Select duration</p>
        <div className="grid grid-cols-2 gap-2">
          {BUNDLE_OPTIONS.map((opt) => (
            <button
              key={opt.months}
              type="button"
              onClick={() => {
                setMonths(opt.months)
                setPromoResult(null)
              }}
              className={`rounded-lg border p-3 text-left transition-colors ${
                months === opt.months
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-surface hover:border-muted'
              }`}
            >
              <span className="text-sm font-semibold text-text-primary">{opt.label}</span>
              <span className="ml-2 text-sm font-bold text-accent">₱{PRICES[opt.months]}</span>
              {opt.badge && (
                <span className="ml-1 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
                  {opt.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Promo code */}
      <div>
        <p className="mb-2 text-sm font-semibold text-text-primary">Promo code (optional)</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => {
              setPromoCode(e.target.value.toUpperCase())
              setPromoResult(null)
              setPromoError('')
            }}
            placeholder="Enter code"
            className="flex-1 rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={handleValidatePromo}
            disabled={!promoCode || validating}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-muted disabled:opacity-40"
          >
            {validating ? '...' : 'Apply'}
          </button>
        </div>
        {promoError && <p className="mt-1 text-xs text-error">{promoError}</p>}
        {promoResult && (
          <p className="mt-1 text-xs text-accent">
            Code applied! Discount: ₱{promoResult.discountValue}
            {promoResult.discountType === 'percentage' ? '%' : ''}
          </p>
        )}
      </div>

      {/* GCash payment details */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-text-primary">Pay via GCash</p>
        <div className="flex items-start gap-4">
          {gcash.qrUrl && (
            <img
              src={gcash.qrUrl}
              alt="GCash QR"
              className="h-24 w-24 rounded-lg border border-border object-cover"
            />
          )}
          <div className="space-y-1">
            <p className="text-xs text-muted">Send to</p>
            <p className="font-outfit text-lg font-bold text-text-primary">{gcash.number}</p>
            <p className="text-sm text-text-secondary">{gcash.name}</p>
            <p className="mt-2 text-xs text-muted">Amount to send</p>
            <p className="font-outfit text-2xl font-black text-accent">₱{finalAmount}</p>
            {promoResult && <p className="text-xs text-muted line-through">₱{base}</p>}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          After paying, take a screenshot of your GCash confirmation and upload it below.
        </p>
      </div>

      {/* Receipt upload */}
      <div>
        <p className="mb-2 text-sm font-semibold text-text-primary">Upload receipt</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-text-secondary transition-colors hover:border-muted"
        >
          {file ? file.name : 'Click to upload screenshot (JPG, PNG — max 5MB)'}
        </button>
      </div>

      {submitError && <p className="text-xs text-error">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting || !file}
        className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-[#0C0C10] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {submitting ? 'Submitting...' : 'Submit upgrade request'}
      </button>
    </form>
  )
}
