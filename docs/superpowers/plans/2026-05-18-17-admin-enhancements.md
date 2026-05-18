# Admin Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 admin capabilities: manual coach tier override, monthly revenue summary, email notifications for upgrade requests, and promo code redemption detail.

**Architecture:** All 4 features are independent slices — they share the same monorepo conventions (shared types → API routes → web components) but do not depend on each other. Execute in order (types first, then API, then web) within each feature, but features themselves can be parallelised if using subagents.

**Tech Stack:** Express + Mongoose + Zod (API), Next.js 15 App Router (web), `packages/shared` for types/schemas, Resend (email), pnpm monorepo, jest with `--runInBand` flag.

---

## File Map

### Feature 1 — Manual Tier Override

- Modify: `packages/shared/src/schemas/admin.schema.ts` — add `proEndsAt` to updateCoachSubscriptionSchema
- Modify: `apps/api/src/modules/admin/admin.repository.ts` — handle proEndsAt in updateCoachSubscription
- Create: `apps/web/src/components/admin/CoachTierEditor.tsx` — inline tier select + save
- Modify: `apps/web/src/app/(admin)/admin/coaches/page.tsx` — embed CoachTierEditor

### Feature 2 — Revenue Summary

- Modify: `packages/shared/src/types/index.ts` — add AdminRevenueSummary type + revenueByMonth to AdminStats
- Modify: `apps/api/src/modules/admin/admin.repository.ts` — add getRevenueSummary()
- Modify: `apps/api/src/modules/admin/admin.controller.ts` — add getRevenueSummary handler
- Modify: `apps/api/src/modules/admin/admin.routes.ts` — add GET /revenue
- Modify: `apps/web/src/app/(admin)/admin/page.tsx` — fetch + render revenue table

### Feature 3 — Email Notifications

- Create: `apps/api/src/services/email.service.ts` — Resend wrapper (3 email functions)
- Modify: `apps/api/src/modules/upgrade-request/upgrade-request.service.ts` — call email service on submit/approve/reject

### Feature 4 — Promo Redemption Detail

- Modify: `packages/shared/src/types/index.ts` — add PublicRedemption type
- Modify: `apps/api/src/modules/promotion/promotion.repository.ts` — add findRedemptionsByPromotion()
- Modify: `apps/api/src/modules/promotion/promotion.controller.ts` — add listRedemptions handler
- Modify: `apps/api/src/modules/promotion/promotion.routes.ts` — add GET /:id/redemptions
- Modify: `apps/web/src/components/admin/AdminPromoList.tsx` — "View redemptions" toggle per promo row

---

## Task 1: Manual tier override — shared schema

**Files:**

- Modify: `packages/shared/src/schemas/admin.schema.ts`

- [ ] **Step 1: Update the schema to accept an optional proEndsAt**

Replace the file contents:

```ts
import { z } from 'zod'

export const updateCoachSubscriptionSchema = z.object({
  tier: z.enum(['starter', 'pro', 'team']),
  proEndsAt: z.string().datetime().optional(),
})
export type UpdateCoachSubscriptionInput = z.infer<typeof updateCoachSubscriptionSchema>
```

- [ ] **Step 2: Rebuild shared package**

```bash
cd packages/shared && npm run build
```

Expected: no errors, `dist/` updated.

- [ ] **Step 3: Run API TypeScript check**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/schemas/admin.schema.ts packages/shared/dist
git commit -m "feat: add optional proEndsAt to updateCoachSubscriptionSchema"
```

---

## Task 2: Manual tier override — API repository

**Files:**

- Modify: `apps/api/src/modules/admin/admin.repository.ts`

- [ ] **Step 1: Update updateCoachSubscription to persist proEndsAt**

Replace the `updateCoachSubscription` method:

```ts
async updateCoachSubscription(coachId: string, tier: SubscriptionTier, proEndsAt?: string): Promise<void> {
  const update: Record<string, unknown> = {
    subscriptionTier: tier,
    subscriptionStatus: 'active',
  }
  if (tier === 'pro' && proEndsAt) {
    update.proEndsAt = new Date(proEndsAt)
  } else if (tier === 'starter') {
    update.proEndsAt = null
  }
  await User.findByIdAndUpdate(coachId, { $set: update })
}
```

- [ ] **Step 2: Update AdminController to pass proEndsAt**

In `apps/api/src/modules/admin/admin.controller.ts`, update the `updateCoachSubscription` handler:

```ts
updateCoachSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tier, proEndsAt } = updateCoachSubscriptionSchema.parse(req.body)
    await this.repo.updateCoachSubscription(req.params.id, tier, proEndsAt)
    res.json({ success: true, data: { message: 'Subscription updated' } })
  } catch (err) {
    next(err)
  }
}
```

- [ ] **Step 3: Run existing admin repository test**

```bash
cd apps/api && npx jest --runInBand --testPathPattern="admin.repository"
```

Expected: PASS (existing tests still green — the new optional param is backwards-compatible).

- [ ] **Step 4: Run admin integration test**

```bash
cd apps/api && npx jest --runInBand --testPathPattern="admin.integration"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/admin/admin.repository.ts apps/api/src/modules/admin/admin.controller.ts
git commit -m "feat: persist proEndsAt on manual coach tier override"
```

---

## Task 3: Manual tier override — web UI

**Files:**

- Create: `apps/web/src/components/admin/CoachTierEditor.tsx`
- Modify: `apps/web/src/app/(admin)/admin/coaches/page.tsx`

- [ ] **Step 1: Create CoachTierEditor client component**

```bash
cat << 'EOF' > apps/web/src/components/admin/CoachTierEditor.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SubscriptionTier } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const TIERS: SubscriptionTier[] = ['starter', 'pro', 'team']

type Props = {
  coachId: string
  currentTier: SubscriptionTier
}

export function CoachTierEditor({ coachId, currentTier }: Props) {
  const router = useRouter()
  const [tier, setTier] = useState<SubscriptionTier>(currentTier)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const isDirty = tier !== currentTier

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await apiFetch(`/api/v1/admin/coaches/${coachId}/subscription`, {
        method: 'PATCH',
        body: { tier },
      })
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={tier}
        onChange={(e) => {
          setTier(e.target.value as SubscriptionTier)
          setSaved(false)
          setError('')
        }}
        className="rounded border border-border bg-base px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
      >
        {TIERS.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
      {isDirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-accent px-2 py-1 text-xs font-semibold text-[#0C0C10] disabled:opacity-40"
        >
          {saving ? '…' : 'Save'}
        </button>
      )}
      {saved && <span className="text-xs text-green-400">✓</span>}
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
}
EOF
```

- [ ] **Step 2: Replace the Tier column in the coaches table**

In `apps/web/src/app/(admin)/admin/coaches/page.tsx`:

Add the import at the top after the existing imports:

```ts
import { CoachTierEditor } from '@/components/admin/CoachTierEditor'
```

Replace the Tier `<td>` cell (currently renders `{TIER_LABEL[coach.subscriptionTier]}`):

```tsx
<td className="px-4 py-3 text-sm text-text-secondary">
  <CoachTierEditor coachId={coach._id} currentTier={coach.subscriptionTier} />
</td>
```

Also remove the now-unused `TIER_LABEL` constant from the top of the file.

- [ ] **Step 3: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/admin/CoachTierEditor.tsx apps/web/src/app/(admin)/admin/coaches/page.tsx
git commit -m "feat: inline tier editor on admin coaches page"
```

---

## Task 4: Revenue summary — types and API

**Files:**

- Modify: `packages/shared/src/types/index.ts`
- Modify: `apps/api/src/modules/admin/admin.repository.ts`
- Modify: `apps/api/src/modules/admin/admin.controller.ts`
- Modify: `apps/api/src/modules/admin/admin.routes.ts`

- [ ] **Step 1: Add AdminRevenueSummary type to shared**

In `packages/shared/src/types/index.ts`, append after the `AdminStats` interface:

```ts
export interface AdminRevenueMonth {
  month: string // e.g. "2026-05"
  revenue: number
  count: number
}
```

- [ ] **Step 2: Rebuild shared**

```bash
cd packages/shared && npm run build
```

- [ ] **Step 3: Add getRevenueSummary to AdminRepository**

In `apps/api/src/modules/admin/admin.repository.ts`, add these imports at the top:

```ts
import { UpgradeRequest } from '../upgrade-request/upgrade-request.model'
```

Then add the method to `AdminRepository`:

```ts
async getRevenueSummary(): Promise<AdminRevenueMonth[]> {
  type AggRow = { _id: string; revenue: number; count: number }
  const rows = await UpgradeRequest.aggregate<AggRow>([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$reviewedAt' } },
        revenue: { $sum: '$amountDue' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 12 },
  ])
  return rows.map((r) => ({ month: r._id, revenue: r.revenue, count: r.count }))
}
```

Also add the import at the top of admin.repository.ts:

```ts
import type {
  AdminCoach,
  AdminStats,
  AdminRevenueMonth,
  SubscriptionTier,
} from '@picklecoach/shared'
```

- [ ] **Step 4: Add controller method**

In `apps/api/src/modules/admin/admin.controller.ts`, add:

```ts
getRevenueSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await this.repo.getRevenueSummary()
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}
```

- [ ] **Step 5: Add route**

In `apps/api/src/modules/admin/admin.routes.ts`, add after the existing routes:

```ts
router.get('/revenue', controller.getRevenueSummary)
```

- [ ] **Step 6: API TypeScript check**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 7: Write a repository test for getRevenueSummary**

In `apps/api/src/modules/admin/admin.repository.test.ts`, add a test (open the file first to see the existing test structure, then append):

```ts
it('returns monthly revenue for approved upgrade requests', async () => {
  // Insert one approved UpgradeRequest
  const { UpgradeRequest } = await import('../upgrade-request/upgrade-request.model')
  const userId = new mongoose.Types.ObjectId()
  await UpgradeRequest.create({
    coachId: userId,
    months: 3,
    amountDue: 399,
    discountApplied: 0,
    receiptUrl: 'https://example.com/r.jpg',
    status: 'approved',
    reviewedAt: new Date(),
    reviewedBy: userId,
  })
  const summary = await repo.getRevenueSummary()
  expect(summary).toHaveLength(1)
  expect(summary[0].revenue).toBe(399)
  expect(summary[0].count).toBe(1)
})
```

- [ ] **Step 8: Run admin repository tests**

```bash
cd apps/api && npx jest --runInBand --testPathPattern="admin.repository"
```

Expected: PASS (including the new test).

- [ ] **Step 9: Commit**

```bash
git add packages/shared/src/types/index.ts packages/shared/dist \
  apps/api/src/modules/admin/admin.repository.ts \
  apps/api/src/modules/admin/admin.controller.ts \
  apps/api/src/modules/admin/admin.routes.ts
git commit -m "feat: monthly revenue summary endpoint for admin"
```

---

## Task 5: Revenue summary — web UI

**Files:**

- Modify: `apps/web/src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: Update Overview page to fetch and render revenue**

Replace the entire file `apps/web/src/app/(admin)/admin/page.tsx`:

```tsx
import type { AdminStats, AdminRevenueMonth } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { StatCard } from '@/components/dashboard/StatCard'

export default async function AdminOverviewPage() {
  const [stats, revenue] = await Promise.all([
    serverApiFetch<AdminStats>('/api/v1/admin/stats'),
    serverApiFetch<AdminRevenueMonth[]>('/api/v1/admin/revenue'),
  ])

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Overview</h1>
      <p className="mt-1 text-sm text-text-secondary">Platform-wide snapshot</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard value={stats?.totalCoaches ?? 0} label="Total Coaches" />
        <StatCard value={stats?.activeTrials ?? 0} label="Active Trials" />
        <StatCard value={stats?.activeSubscriptions ?? 0} label="Active Subscriptions" />
      </div>

      <div className="mt-10">
        <h2 className="font-outfit text-xl font-semibold text-text-primary">Revenue by Month</h2>
        <p className="mt-1 mb-4 text-sm text-text-secondary">
          Approved upgrade requests · last 12 months
        </p>
        {(revenue?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted">No approved upgrades yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Month
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Approvals
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {(revenue ?? []).map((row, i) => (
                  <tr
                    key={row.month}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surface/50'}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{row.month}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{row.count}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-accent">
                      ₱{row.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(admin)/admin/page.tsx
git commit -m "feat: revenue by month table on admin overview page"
```

---

## Task 6: Email notifications — email service

**Files:**

- Create: `apps/api/src/services/email.service.ts`

Note: `resend` is already in `apps/api/package.json`. `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are already in `env.ts` with placeholder defaults.

- [ ] **Step 1: Create the email service**

```bash
cat << 'EOF' > apps/api/src/services/email.service.ts
import { Resend } from 'resend'
import { env } from '../config/env'

const resend = new Resend(env.RESEND_API_KEY)

export async function sendUpgradeRequestReceived(
  coachEmail: string,
  coachName: string,
  months: number,
  amountDue: number
): Promise<void> {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: coachEmail,
    subject: 'PickleCoach — Upgrade request received',
    html: `<p>Hi ${coachName},</p>
<p>We received your Pro upgrade request for <strong>${months} month${months > 1 ? 's' : ''}</strong> (₱${amountDue}).</p>
<p>We'll review your GCash receipt and activate your Pro account within 24 hours.</p>
<p>— The PickleCoach Team</p>`,
  })
}

export async function sendUpgradeApproved(
  coachEmail: string,
  coachName: string,
  months: number,
  proEndsAt: Date
): Promise<void> {
  const expiryStr = proEndsAt.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: coachEmail,
    subject: 'PickleCoach — Pro account activated!',
    html: `<p>Hi ${coachName},</p>
<p>Your Pro subscription is now active for <strong>${months} month${months > 1 ? 's' : ''}</strong>.</p>
<p>Your Pro access expires on <strong>${expiryStr}</strong>.</p>
<p>Enjoy all Pro features — track student progress, and more.</p>
<p>— The PickleCoach Team</p>`,
  })
}

export async function sendUpgradeRejected(
  coachEmail: string,
  coachName: string,
  notes?: string
): Promise<void> {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: coachEmail,
    subject: 'PickleCoach — Upgrade request update',
    html: `<p>Hi ${coachName},</p>
<p>Unfortunately, we were unable to approve your upgrade request.</p>
${notes ? `<p>Reason: ${notes}</p>` : ''}
<p>Please double-check your GCash receipt and submit a new request, or contact support.</p>
<p>— The PickleCoach Team</p>`,
  })
}
EOF
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/services/email.service.ts
git commit -m "feat: email service wrapper (Resend) for upgrade request notifications"
```

---

## Task 7: Email notifications — wire into upgrade request service

**Files:**

- Modify: `apps/api/src/modules/upgrade-request/upgrade-request.service.ts`

- [ ] **Step 1: Read the current service file**

Read `apps/api/src/modules/upgrade-request/upgrade-request.service.ts` to see the current `submit`, `approve`, and `reject` method bodies.

- [ ] **Step 2: Add import at the top of the service**

After existing imports, add:

```ts
import {
  sendUpgradeRequestReceived,
  sendUpgradeApproved,
  sendUpgradeRejected,
} from '../../services/email.service'
import { User } from '../auth/auth.model'
```

- [ ] **Step 3: Add email send in submit() — after successful creation**

Inside `submit()`, after `const request = await this.repo.create(...)`, add:

```ts
// Fire-and-forget — email failure must not break the submission
const coach = await User.findById(input.coachId).lean()
if (coach) {
  sendUpgradeRequestReceived(coach.email, coach.name, input.months, request.amountDue).catch(
    (err) => console.error('[email] sendUpgradeRequestReceived failed:', err)
  )
}
```

- [ ] **Step 4: Add email send in approve() — after tier update**

Inside `approve()`, after the user's subscriptionTier has been updated (look for the User.findByIdAndUpdate call), add:

```ts
const coach = await User.findById(request.coachId).lean()
if (coach?.proEndsAt) {
  sendUpgradeApproved(coach.email, coach.name, request.months, coach.proEndsAt).catch((err) =>
    console.error('[email] sendUpgradeApproved failed:', err)
  )
}
```

- [ ] **Step 5: Add email send in reject() — after status update**

Inside `reject()`, after the request status is set to 'rejected', add:

```ts
const coach = await User.findById(request.coachId).lean()
if (coach) {
  sendUpgradeRejected(coach.email, coach.name, input.notes).catch((err) =>
    console.error('[email] sendUpgradeRejected failed:', err)
  )
}
```

- [ ] **Step 6: Run upgrade-request integration tests**

```bash
cd apps/api && npx jest --runInBand --testPathPattern="upgrade-request.integration"
```

Expected: PASS. (The integration tests mock the service layer, so email calls won't execute.)

- [ ] **Step 7: TypeScript check**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/upgrade-request/upgrade-request.service.ts
git commit -m "feat: send email on upgrade request submit, approve, and reject"
```

---

## Task 8: Promo redemption detail — types and API

**Files:**

- Modify: `packages/shared/src/types/index.ts`
- Modify: `apps/api/src/modules/promotion/promotion.repository.ts`
- Modify: `apps/api/src/modules/promotion/promotion.controller.ts`
- Modify: `apps/api/src/modules/promotion/promotion.routes.ts`

- [ ] **Step 1: Add PublicRedemption type to shared**

In `packages/shared/src/types/index.ts`, append after the `PublicPromotion` interface:

```ts
export interface PublicRedemption {
  _id: string
  coachName: string
  coachEmail: string
  discountApplied: number
  redeemedAt: string
}
```

- [ ] **Step 2: Rebuild shared**

```bash
cd packages/shared && npm run build
```

- [ ] **Step 3: Add findRedemptionsByPromotion to PromotionRepository**

In `apps/api/src/modules/promotion/promotion.repository.ts`, add the method signature to `IPromotionRepository` interface:

```ts
findRedemptionsByPromotion(promotionId: string): Promise<PublicRedemption[]>
```

Then add the implementation to `PromotionRepository`:

```ts
async findRedemptionsByPromotion(promotionId: string): Promise<PublicRedemption[]> {
  type RedemptionRow = {
    _id: mongoose.Types.ObjectId
    discountApplied: number
    redeemedAt: Date
    coach: { name: string; email: string } | null
  }
  const rows = await Redemption.aggregate<RedemptionRow>([
    { $match: { promotionId: new mongoose.Types.ObjectId(promotionId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'coachId',
        foreignField: '_id',
        as: 'coach',
        pipeline: [{ $project: { name: 1, email: 1 } }],
      },
    },
    { $unwind: { path: '$coach', preserveNullAndEmptyArrays: true } },
    { $sort: { redeemedAt: -1 } },
  ])
  return rows.map((r) => ({
    _id: r._id.toString(),
    coachName: r.coach?.name ?? 'Unknown',
    coachEmail: r.coach?.email ?? '',
    discountApplied: r.discountApplied,
    redeemedAt: r.redeemedAt.toISOString(),
  }))
}
```

Also add import at top if not already present:

```ts
import type { PublicRedemption } from '@picklecoach/shared'
import mongoose from 'mongoose'
```

- [ ] **Step 4: Add listRedemptions to PromotionController**

In `apps/api/src/modules/promotion/promotion.controller.ts`, add:

```ts
listRedemptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await this.repo.findRedemptionsByPromotion(req.params.id)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}
```

- [ ] **Step 5: Add route**

In `apps/api/src/modules/promotion/promotion.routes.ts`, add before the export:

```ts
router.get('/:id/redemptions', authenticate, requireRole('super_admin'), controller.listRedemptions)
```

- [ ] **Step 6: TypeScript check**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/types/index.ts packages/shared/dist \
  apps/api/src/modules/promotion/promotion.repository.ts \
  apps/api/src/modules/promotion/promotion.controller.ts \
  apps/api/src/modules/promotion/promotion.routes.ts
git commit -m "feat: redemption detail endpoint GET /promotions/:id/redemptions"
```

---

## Task 9: Promo redemption detail — web UI

**Files:**

- Modify: `apps/web/src/components/admin/AdminPromoList.tsx`

- [ ] **Step 1: Add redemption state and fetch logic to AdminPromoList**

Add the following imports at the top of `AdminPromoList.tsx` if not already there:

```ts
import type { PublicRedemption } from '@picklecoach/shared'
```

Add a state variable inside the component (below the existing `deactivatingId` state):

```ts
const [redemptionsById, setRedemptionsById] = useState<Record<string, PublicRedemption[] | null>>(
  {}
)
const [loadingRedemptions, setLoadingRedemptions] = useState<string | null>(null)
```

Add a handler:

```ts
const handleViewRedemptions = async (promoId: string) => {
  if (redemptionsById[promoId] !== undefined) {
    // Toggle off if already loaded
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
```

- [ ] **Step 2: Add "Redemptions" button and inline table to the promo table rows**

In the promo table, add a new header column after the Status column header:

```tsx
<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
  Redeemed By
</th>
```

In each promo row (`{initialPromos.map(...)}`), replace the last `<td>` (the action cell) with two cells:

```tsx
<td className="px-4 py-3 text-right">
  <button
    onClick={() => handleViewRedemptions(promo._id)}
    disabled={loadingRedemptions === promo._id}
    className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-50 mr-2"
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
```

After each promo row `<tr>`, add a conditional expansion row:

```tsx
{
  redemptionsById[promo._id] !== undefined && (
    <tr key={`${promo._id}-redemptions`} className="bg-surface/30">
      <td colSpan={7} className="px-4 py-3">
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
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/admin/AdminPromoList.tsx
git commit -m "feat: inline redemption list per promo code on admin promotions page"
```

---

## Task 10: Full test suite and final verification

- [ ] **Step 1: Run all API tests**

```bash
cd apps/api && npx jest --runInBand 2>&1 | tail -20
```

Expected: all tests pass, count ≥ 320 (previous baseline).

- [ ] **Step 2: Web TypeScript final check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Start dev servers and verify in browser**

Start API: `cd apps/api && npm run dev`
Start web: `cd apps/web && npm run dev`

Visit:

1. `/admin/coaches` — verify the Tier column shows a select dropdown; change a coach's tier and click Save; confirm ✓ appears and page refreshes with new tier.
2. `/admin` — verify the Revenue by Month table appears (may be empty if no approved requests; that's OK).
3. `/admin/promotions` — click "Redemptions" on a promo; if there are redemptions, the inline table should expand.
4. Submit an upgrade request as a coach — confirm email received at coach address (skip if `RESEND_API_KEY` is a placeholder).
