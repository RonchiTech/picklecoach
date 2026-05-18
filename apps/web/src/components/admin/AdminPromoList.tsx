'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  DiscountType,
  PublicPromotion,
  PublicRedemption,
  SubscriptionTier,
} from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const TIER_OPTIONS: SubscriptionTier[] = ['starter', 'pro', 'team']

type FormState = {
  code: string
  discountType: DiscountType
  discountValue: string
  applicableTiers: SubscriptionTier[]
  expiresAt: string
  maxRedemptions: string
}

const EMPTY_FORM: FormState = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  applicableTiers: [],
  expiresAt: '',
  maxRedemptions: '',
}

export function AdminPromoList({ initialPromos }: { initialPromos: PublicPromotion[] }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const [redemptionsById, setRedemptionsById] = useState<Record<string, PublicRedemption[] | null>>(
    {}
  )
  const [loadingRedemptions, setLoadingRedemptions] = useState<string | null>(null)
  const router = useRouter()

  const toggleTier = (tier: SubscriptionTier) => {
    setForm((f) => ({
      ...f,
      applicableTiers: f.applicableTiers.includes(tier)
        ? f.applicableTiers.filter((t) => t !== tier)
        : [...f.applicableTiers, tier],
    }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      await apiFetch('/api/v1/promotions', {
        method: 'POST',
        body: {
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          applicableTiers: form.applicableTiers,
          ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt).toISOString() } : {}),
          ...(form.maxRedemptions ? { maxRedemptions: Number(form.maxRedemptions) } : {}),
        },
      })
      setForm(EMPTY_FORM)
      router.refresh()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this promotion? Coaches will no longer be able to redeem it.')) return
    setDeactivatingId(id)
    try {
      await apiFetch(`/api/v1/promotions/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeactivatingId(null)
    }
  }

  const handleViewRedemptions = async (promoId: string) => {
    if (redemptionsById[promoId] !== undefined) {
      setRedemptionsById((prev) => {
        const next = { ...prev }
        delete next[promoId]
        return next
      })
      return
    }
    setLoadingRedemptions(promoId)
    try {
      const res = await apiFetch<{ success: true; data: PublicRedemption[] }>(
        `/api/v1/promotions/${promoId}/redemptions`
      )
      setRedemptionsById((prev) => ({ ...prev, [promoId]: res.data }))
    } catch {
      setRedemptionsById((prev) => ({ ...prev, [promoId]: null }))
    } finally {
      setLoadingRedemptions(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 font-outfit text-lg font-semibold text-text-primary">
          Create Promo Code
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Code
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="LAUNCH50"
                required
                className="w-full rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Discount Type
              </label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountType: e.target.value as DiscountType }))
                }
                className="w-full rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₱)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Discount Value {form.discountType === 'percentage' ? '(%)' : '(₱)'}
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === 'percentage' ? '20' : '500'}
                required
                min={1}
                className="w-full rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Max Redemptions (optional)
              </label>
              <input
                type="number"
                value={form.maxRedemptions}
                onChange={(e) => setForm((f) => ({ ...f, maxRedemptions: e.target.value }))}
                placeholder="100"
                min={1}
                className="w-full rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Expires At (optional)
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="w-full rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Applicable Tiers
              </label>
              <div className="flex gap-3 pt-1">
                {TIER_OPTIONS.map((tier) => (
                  <label
                    key={tier}
                    className="flex cursor-pointer items-center gap-1.5 text-sm text-text-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={form.applicableTiers.includes(tier)}
                      onChange={() => toggleTier(tier)}
                      className="accent-accent"
                    />
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
          {createError && <p className="text-sm text-error">{createError}</p>}
          <button
            type="submit"
            disabled={
              creating || !form.code || !form.discountValue || form.applicableTiers.length === 0
            }
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-base disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create Promotion'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-4 font-outfit text-lg font-semibold text-text-primary">All Promotions</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Discount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Tiers
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Redemptions
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {initialPromos.map((promo, i) => (
                <>
                  <tr
                    key={promo._id}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surface/50'}`}
                  >
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-text-primary">
                      {promo.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {promo.discountType === 'percentage'
                        ? `${promo.discountValue}%`
                        : `₱${promo.discountValue}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {promo.applicableTiers.join(', ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {promo.currentRedemptions}
                      {promo.maxRedemptions ? ` / ${promo.maxRedemptions}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${promo.isActive ? 'bg-green-500/10 text-green-400' : 'bg-muted/10 text-muted'}`}
                      >
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewRedemptions(promo._id)}
                        disabled={loadingRedemptions === promo._id}
                        className="mr-2 rounded-md border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                      >
                        {loadingRedemptions === promo._id
                          ? '…'
                          : redemptionsById[promo._id] !== undefined
                            ? 'Hide'
                            : 'Redemptions'}
                      </button>
                      {promo.isActive && (
                        <button
                          onClick={() => handleDeactivate(promo._id)}
                          disabled={deactivatingId === promo._id}
                          className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-error hover:text-error disabled:opacity-50"
                        >
                          {deactivatingId === promo._id ? 'Deactivating…' : 'Deactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {redemptionsById[promo._id] !== undefined && (
                    <tr key={`${promo._id}-redemptions`} className="bg-surface/30">
                      <td colSpan={6} className="px-4 py-3">
                        {redemptionsById[promo._id] === null ? (
                          <p className="text-xs text-error">Failed to load redemptions.</p>
                        ) : redemptionsById[promo._id]!.length === 0 ? (
                          <p className="text-xs text-muted">No redemptions yet.</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-muted">
                                <th className="pb-1 pr-4">Coach</th>
                                <th className="pb-1 pr-4">Email</th>
                                <th className="pb-1 pr-4">Discount</th>
                                <th className="pb-1">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {redemptionsById[promo._id]!.map((r) => (
                                <tr key={r._id} className="text-text-secondary">
                                  <td className="py-0.5 pr-4">{r.coachName}</td>
                                  <td className="py-0.5 pr-4">{r.coachEmail}</td>
                                  <td className="py-0.5 pr-4">₱{r.discountApplied}</td>
                                  <td className="py-0.5">
                                    {new Date(r.redeemedAt).toLocaleDateString('en-PH', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {initialPromos.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-text-secondary">
              No promotions yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
