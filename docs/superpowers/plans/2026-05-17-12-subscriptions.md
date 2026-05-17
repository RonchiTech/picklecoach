# Subscriptions Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the existing subscription fields on the User model into a real `GET /api/v1/subscriptions/me` endpoint, enforce account locking after trial + 7-day grace period anchored to `trialEndsAt` (not cancellation date), and surface trial countdown and lock state in the dashboard UI.

**Architecture:** The User model already has `subscriptionTier`, `subscriptionStatus`, and `trialEndsAt` — no new Mongoose collection needed. A new `subscription` module reads those fields and computes derived state (`daysRemaining`, `lockedAt`, `isLocked`). A `requireActive` middleware does a DB lookup on protected routes and blocks coaches once `now > trialEndsAt + 7 days`. The dashboard layout renders a locked state inline when `isLocked`, and a `TrialBanner` component on the dashboard home page counts down the trial.

**Tech Stack:** Express.js, Mongoose (User model — no new model), Next.js 15 App Router, TypeScript, Tailwind CSS v4

---

## File Map

**Create:**

- `apps/api/src/modules/subscription/subscription.repository.ts`
- `apps/api/src/modules/subscription/subscription.repository.test.ts`
- `apps/api/src/modules/subscription/subscription.service.ts`
- `apps/api/src/modules/subscription/subscription.service.test.ts`
- `apps/api/src/modules/subscription/subscription.controller.ts`
- `apps/api/src/modules/subscription/subscription.routes.ts`
- `apps/api/src/modules/subscription/subscription.integration.test.ts`
- `apps/web/src/components/dashboard/TrialBanner.tsx`

**Modify:**

- `packages/shared/src/types/index.ts` — add `SubscriptionInfo` interface
- `apps/api/src/middleware/auth.middleware.ts` — add `requireActive`
- `apps/api/src/app.ts` — mount subscription routes, add `requireActive` to data routes
- `apps/web/src/app/(dashboard)/layout.tsx` — fetch subscription, show locked state inline
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — add `TrialBanner`

---

### Task 1: Add SubscriptionInfo to shared types

**Files:**

- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Add the SubscriptionInfo interface**

Open `packages/shared/src/types/index.ts`. Add this block after the `CoachDirectoryResult` interface at the bottom of the file:

```typescript
export interface SubscriptionInfo {
  tier: SubscriptionTier
  status: SubscriptionStatus
  trialEndsAt: string // ISO date — natural end of trial period
  lockedAt: string // trialEndsAt + 7 days — hard lock date
  daysRemaining: number // days until trialEndsAt; 0 if already past
  isLocked: boolean // true when now > lockedAt
}
```

- [ ] **Step 2: Build shared**

```bash
cd packages/shared && pnpm build
```

Expected: no output, exit 0.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/index.ts
git commit -m "feat(shared): add SubscriptionInfo type"
```

---

### Task 2: Subscription repository

**Files:**

- Create: `apps/api/src/modules/subscription/subscription.repository.ts`
- Create: `apps/api/src/modules/subscription/subscription.repository.test.ts`

The repository reads `subscriptionTier`, `subscriptionStatus`, and `trialEndsAt` from the existing User model. No new Mongoose model.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/subscription/subscription.repository.test.ts`:

```typescript
import mongoose from 'mongoose'
import { User } from '../auth/auth.model'
import { SubscriptionRepository } from './subscription.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new SubscriptionRepository()

const seed = (overrides: Record<string, unknown> = {}) =>
  User.create({
    name: 'Coach Sub',
    email: 'sub@test.com',
    passwordHash: 'hash',
    role: 'coach',
    subscriptionTier: 'starter',
    subscriptionStatus: 'trial',
    trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    ...overrides,
  })

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
})

describe('SubscriptionRepository.findByUserId', () => {
  it('returns subscription fields for existing user', async () => {
    const user = await seed()
    const result = await repo.findByUserId(user._id.toString())
    expect(result).not.toBeNull()
    expect(result!.tier).toBe('starter')
    expect(result!.status).toBe('trial')
    expect(result!.trialEndsAt).toBeInstanceOf(Date)
  })

  it('returns null for unknown userId', async () => {
    const result = await repo.findByUserId(new mongoose.Types.ObjectId().toString())
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd apps/api && npx jest subscription.repository --runInBand
```

Expected: FAIL — `Cannot find module './subscription.repository'`

- [ ] **Step 3: Implement the repository**

Create `apps/api/src/modules/subscription/subscription.repository.ts`:

```typescript
import { User } from '../auth/auth.model'
import type { SubscriptionTier, SubscriptionStatus } from '@picklecoach/shared'

export interface SubscriptionData {
  tier: SubscriptionTier
  status: SubscriptionStatus
  trialEndsAt: Date
}

export interface ISubscriptionRepository {
  findByUserId(userId: string): Promise<SubscriptionData | null>
}

export class SubscriptionRepository implements ISubscriptionRepository {
  async findByUserId(userId: string): Promise<SubscriptionData | null> {
    const user = await User.findById(userId).select(
      'subscriptionTier subscriptionStatus trialEndsAt'
    )
    if (!user) return null
    return {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
    }
  }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd apps/api && npx jest subscription.repository --runInBand
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/subscription/
git commit -m "feat(subscription): add subscription repository"
```

---

### Task 3: Subscription service

**Files:**

- Create: `apps/api/src/modules/subscription/subscription.service.ts`
- Create: `apps/api/src/modules/subscription/subscription.service.test.ts`

The service computes the derived lock state. `lockedAt` is always `trialEndsAt + 7 days` — anchored to the period end, not to any user action — so there's no way to game the grace window by cancelling and re-cancelling.

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/modules/subscription/subscription.service.test.ts`:

```typescript
import { SubscriptionService } from './subscription.service'
import type { ISubscriptionRepository, SubscriptionData } from './subscription.repository'

const GRACE_MS = 7 * 24 * 60 * 60 * 1000

function makeRepo(data: SubscriptionData | null): ISubscriptionRepository {
  return { findByUserId: jest.fn().mockResolvedValue(data) }
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

describe('SubscriptionService.getMySubscription', () => {
  it('throws 404 when user not found', async () => {
    const service = new SubscriptionService(makeRepo(null))
    await expect(service.getMySubscription('unknown')).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('returns daysRemaining > 0 when trial is active', async () => {
    const trialEndsAt = daysFromNow(30)
    const service = new SubscriptionService(
      makeRepo({ tier: 'starter', status: 'trial', trialEndsAt })
    )
    const result = await service.getMySubscription('userId')
    expect(result.daysRemaining).toBe(30)
    expect(result.isLocked).toBe(false)
  })

  it('returns daysRemaining 0 and isLocked false during 7-day grace period', async () => {
    const trialEndsAt = daysFromNow(-3)
    const service = new SubscriptionService(
      makeRepo({ tier: 'starter', status: 'trial', trialEndsAt })
    )
    const result = await service.getMySubscription('userId')
    expect(result.daysRemaining).toBe(0)
    expect(result.isLocked).toBe(false)
    expect(new Date(result.lockedAt).getTime()).toBe(trialEndsAt.getTime() + GRACE_MS)
  })

  it('returns isLocked true when past grace period', async () => {
    const trialEndsAt = daysFromNow(-10)
    const service = new SubscriptionService(
      makeRepo({ tier: 'starter', status: 'trial', trialEndsAt })
    )
    const result = await service.getMySubscription('userId')
    expect(result.isLocked).toBe(true)
  })

  it('returns correct ISO string dates', async () => {
    const trialEndsAt = daysFromNow(15)
    const service = new SubscriptionService(
      makeRepo({ tier: 'starter', status: 'trial', trialEndsAt })
    )
    const result = await service.getMySubscription('userId')
    expect(result.trialEndsAt).toBe(trialEndsAt.toISOString())
    expect(new Date(result.lockedAt).getTime()).toBe(trialEndsAt.getTime() + GRACE_MS)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd apps/api && npx jest subscription.service --runInBand
```

Expected: FAIL — `Cannot find module './subscription.service'`

- [ ] **Step 3: Implement the service**

Create `apps/api/src/modules/subscription/subscription.service.ts`:

```typescript
import type { SubscriptionInfo } from '@picklecoach/shared'
import type { ISubscriptionRepository } from './subscription.repository'
import { createError } from '../../middleware/error.middleware'

const GRACE_MS = 7 * 24 * 60 * 60 * 1000

export class SubscriptionService {
  constructor(private repo: ISubscriptionRepository) {}

  async getMySubscription(userId: string): Promise<SubscriptionInfo> {
    const data = await this.repo.findByUserId(userId)
    if (!data) throw createError('User not found', 404, 'USER_NOT_FOUND')

    const now = Date.now()
    const trialEnd = data.trialEndsAt.getTime()
    const lockEnd = trialEnd + GRACE_MS

    return {
      tier: data.tier,
      status: data.status,
      trialEndsAt: data.trialEndsAt.toISOString(),
      lockedAt: new Date(lockEnd).toISOString(),
      daysRemaining: Math.max(0, Math.floor((trialEnd - now) / (24 * 60 * 60 * 1000))),
      isLocked: now > lockEnd,
    }
  }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd apps/api && npx jest subscription.service --runInBand
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/subscription/
git commit -m "feat(subscription): add subscription service with lock computation"
```

---

### Task 4: Controller, routes, and app.ts mount

**Files:**

- Create: `apps/api/src/modules/subscription/subscription.controller.ts`
- Create: `apps/api/src/modules/subscription/subscription.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create the controller**

Create `apps/api/src/modules/subscription/subscription.controller.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express'
import type { SubscriptionService } from './subscription.service'

export class SubscriptionController {
  constructor(private service: SubscriptionService) {}

  getMySubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getMySubscription(req.user!.userId)
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  }
}
```

- [ ] **Step 2: Create the routes**

Create `apps/api/src/modules/subscription/subscription.routes.ts`:

```typescript
import { Router } from 'express'
import { SubscriptionRepository } from './subscription.repository'
import { SubscriptionService } from './subscription.service'
import { SubscriptionController } from './subscription.controller'
import { authenticate } from '../../middleware/auth.middleware'

const router = Router()
const repo = new SubscriptionRepository()
const service = new SubscriptionService(repo)
const controller = new SubscriptionController(service)

router.get('/me', authenticate, controller.getMySubscription)

export { router as subscriptionRoutes }
```

- [ ] **Step 3: Mount in app.ts**

Open `apps/api/src/app.ts`. Add the import at the top with the other route imports:

```typescript
import { subscriptionRoutes } from './modules/subscription/subscription.routes'
```

Then add the route mount. The subscriptions route goes immediately after `authRoutes` and is intentionally NOT wrapped with `requireActive` — locked coaches must still be able to read their subscription status to understand why they're blocked:

```typescript
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/subscriptions', subscriptionRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)
app.use('/api/v1/students', studentRoutes)
app.use('/api/v1/sessions', sessionRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/coach-profiles', coachProfileRoutes)
app.use('/api/v1/coaches', publicCoachesRoutes)
```

(The `requireActive` wiring happens in Task 6 after the middleware is implemented.)

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/subscription/ apps/api/src/app.ts
git commit -m "feat(subscription): add GET /api/v1/subscriptions/me endpoint"
```

---

### Task 5: Integration test for the endpoint

**Files:**

- Create: `apps/api/src/modules/subscription/subscription.integration.test.ts`

- [ ] **Step 1: Write the integration test**

Create `apps/api/src/modules/subscription/subscription.integration.test.ts`:

```typescript
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
})

async function registerAndLogin(email = 'sub@test.com') {
  await request(app).post('/api/v1/auth/register').send({
    name: 'Coach Sub',
    email,
    password: 'Password1!',
  })
  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email,
    password: 'Password1!',
  })
  return loginRes.headers['set-cookie'] as string[]
}

describe('GET /api/v1/subscriptions/me', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/subscriptions/me')
    expect(res.status).toBe(401)
  })

  it('returns subscription info for authenticated coach', async () => {
    const cookies = await registerAndLogin()
    const res = await request(app).get('/api/v1/subscriptions/me').set('Cookie', cookies)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.tier).toBe('starter')
    expect(res.body.data.status).toBe('trial')
    expect(res.body.data.daysRemaining).toBeGreaterThan(0)
    expect(res.body.data.isLocked).toBe(false)
    expect(typeof res.body.data.trialEndsAt).toBe('string')
    expect(typeof res.body.data.lockedAt).toBe('string')
  })
})
```

- [ ] **Step 2: Run to verify it passes**

```bash
cd apps/api && npx jest subscription.integration --runInBand
```

Expected: PASS — 2 tests

- [ ] **Step 3: Run full suite to catch regressions**

```bash
cd apps/api && npm test -- --forceExit
```

Expected: all 222 tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/subscription/subscription.integration.test.ts
git commit -m "test(subscription): add integration tests for subscriptions endpoint"
```

---

### Task 6: requireActive middleware and route enforcement

**Files:**

- Modify: `apps/api/src/middleware/auth.middleware.ts`
- Modify: `apps/api/src/modules/subscription/subscription.integration.test.ts`
- Modify: `apps/api/src/app.ts`

`requireActive` does a DB query to get `trialEndsAt` — using the live DB value means admin-updated trials take effect immediately on the next request (no stale JWT problem). Lock date is `trialEndsAt + 7 days`. Cancellation date is irrelevant — the window is always anchored to `trialEndsAt`.

- [ ] **Step 1: Add requireActive tests to the integration file**

Open `apps/api/src/modules/subscription/subscription.integration.test.ts`. Add these describes after the existing one:

```typescript
describe('requireActive middleware', () => {
  it('allows access to /api/v1/students when trial is active', async () => {
    const cookies = await registerAndLogin('active@test.com')
    const res = await request(app).get('/api/v1/students').set('Cookie', cookies)
    expect(res.status).toBe(200)
  })

  it('blocks /api/v1/students with 403 ACCOUNT_LOCKED when past grace period', async () => {
    const cookies = await registerAndLogin('locked@test.com')
    await User.updateOne(
      { email: 'locked@test.com' },
      { trialEndsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
    )
    const res = await request(app).get('/api/v1/students').set('Cookie', cookies)
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('ACCOUNT_LOCKED')
  })

  it('allows access during 7-day grace period (3 days past trialEndsAt)', async () => {
    const cookies = await registerAndLogin('grace@test.com')
    await User.updateOne(
      { email: 'grace@test.com' },
      { trialEndsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
    )
    const res = await request(app).get('/api/v1/students').set('Cookie', cookies)
    expect(res.status).toBe(200)
  })

  it('does NOT block /api/v1/subscriptions/me when locked (coach can read why)', async () => {
    const cookies = await registerAndLogin('subcheck@test.com')
    await User.updateOne(
      { email: 'subcheck@test.com' },
      { trialEndsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
    )
    const res = await request(app).get('/api/v1/subscriptions/me').set('Cookie', cookies)
    expect(res.status).toBe(200)
    expect(res.body.data.isLocked).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify the new tests fail**

```bash
cd apps/api && npx jest subscription.integration --runInBand
```

Expected: 2 new tests FAIL — the locked test gets 200 instead of 403.

- [ ] **Step 3: Add requireActive to auth.middleware.ts**

Open `apps/api/src/middleware/auth.middleware.ts`. Replace the entire file with:

```typescript
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { UserRole } from '@picklecoach/shared'
import { env } from '../config/env'
import { createError } from './error.middleware'
import type { JwtPayload } from '../modules/auth/auth.service'
import { User } from '../modules/auth/auth.model'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

const GRACE_MS = 7 * 24 * 60 * 60 * 1000

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined
  if (!token) return next(createError('Not authenticated', 401, 'NOT_AUTHENTICATED'))

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    next(createError('Invalid or expired token', 401, 'INVALID_TOKEN'))
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(createError('Not authenticated', 401, 'NOT_AUTHENTICATED'))
    if (!roles.includes(req.user.role)) return next(createError('Forbidden', 403, 'FORBIDDEN'))
    next()
  }
}

export function requireActive(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.user?.userId
  if (!userId) return next(createError('Not authenticated', 401, 'NOT_AUTHENTICATED'))

  User.findById(userId)
    .select('trialEndsAt')
    .then((user) => {
      if (!user) return next(createError('User not found', 404, 'USER_NOT_FOUND'))
      const lockedAt = new Date(user.trialEndsAt.getTime() + GRACE_MS)
      if (new Date() > lockedAt) {
        return next(
          createError(
            'Your trial period has ended. Please contact support to reactivate your account.',
            403,
            'ACCOUNT_LOCKED'
          )
        )
      }
      next()
    })
    .catch(next)
}
```

- [ ] **Step 4: Wire requireActive in app.ts**

Open `apps/api/src/app.ts`. Add `requireActive` to the import:

```typescript
import { authenticate, requireActive } from './middleware/auth.middleware'
```

Replace the data route mounts with `requireActive` applied after `authenticate`. The `subscriptionRoutes` stays without `requireActive` — locked coaches must be able to read their status:

```typescript
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/subscriptions', subscriptionRoutes)
app.use('/api/v1/dashboard', authenticate, requireActive, dashboardRoutes)
app.use('/api/v1/students', authenticate, requireActive, studentRoutes)
app.use('/api/v1/sessions', authenticate, requireActive, sessionRoutes)
app.use('/api/v1/payments', authenticate, requireActive, paymentRoutes)
app.use('/api/v1/coach-profiles', authenticate, requireActive, coachProfileRoutes)
app.use('/api/v1/coaches', publicCoachesRoutes)
```

Note: `authenticate` is now applied at the app level for data routes AND inside each route file (e.g., `router.get('/', authenticate, controller.list)`). The double call is harmless — `authenticate` just re-validates the same JWT. This avoids a larger refactor of all route files.

- [ ] **Step 5: Run integration tests**

```bash
cd apps/api && npx jest subscription.integration --runInBand
```

Expected: PASS — 6 tests

- [ ] **Step 6: Run full suite**

```bash
cd apps/api && npm test -- --forceExit
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/middleware/auth.middleware.ts apps/api/src/app.ts apps/api/src/modules/subscription/subscription.integration.test.ts
git commit -m "feat(subscription): add requireActive middleware, enforce on all data routes"
```

---

### Task 7: TrialBanner component

**Files:**

- Create: `apps/web/src/components/dashboard/TrialBanner.tsx`
- Modify: `apps/web/src/app/(dashboard)/dashboard/page.tsx`

The banner is a client component (needs `useEffect` for the fetch). It shows when `status === 'trial'`. During active trial: "X days left in your free trial". In the 7-day grace period (trial ended, not yet locked): "Trial ended — X days of grace period remaining". Turns red/urgent when ≤ 7 days.

- [ ] **Step 1: Create TrialBanner**

Create `apps/web/src/components/dashboard/TrialBanner.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import type { SubscriptionInfo } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

export function TrialBanner() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null)

  useEffect(() => {
    apiFetch<{ success: true; data: SubscriptionInfo }>('/api/v1/subscriptions/me')
      .then((res) => setSub(res.data))
      .catch(() => {})
  }, [])

  if (!sub || sub.status !== 'trial') return null

  const inGrace = sub.daysRemaining === 0 && !sub.isLocked
  const graceDaysLeft = inGrace
    ? Math.ceil((new Date(sub.lockedAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : 0
  const urgent = sub.daysRemaining <= 7 || inGrace

  const message = inGrace
    ? `Trial ended — ${graceDaysLeft} day${graceDaysLeft === 1 ? '' : 's'} of grace period remaining`
    : `${sub.daysRemaining} day${sub.daysRemaining === 1 ? '' : 's'} left in your free trial`

  return (
    <div
      className={`mb-6 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
        urgent
          ? 'border-error bg-[#1a0d0d] text-error'
          : 'border-border bg-surface text-text-secondary'
      }`}
    >
      <span>{message}</span>
      <span className="ml-4 shrink-0 text-xs text-muted">Upgrade coming soon</span>
    </div>
  )
}
```

- [ ] **Step 2: Add TrialBanner to dashboard page**

Open `apps/web/src/app/(dashboard)/dashboard/page.tsx`. Replace the entire file with:

```tsx
import type { DashboardStats } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { StatCard } from '@/components/dashboard/StatCard'
import { TrialBanner } from '@/components/dashboard/TrialBanner'

export default async function DashboardPage() {
  const stats = await serverApiFetch<DashboardStats>('/api/v1/dashboard/stats')

  const todaySessions = stats?.todaySessions ?? 0
  const totalStudents = stats?.totalStudents ?? 0
  const unpaidBalance = stats?.unpaidBalance ?? 0

  return (
    <div>
      <TrialBanner />
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-text-secondary">Your coaching overview</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard value={todaySessions} label="Sessions Today" />
        <StatCard value={totalStudents} label="Total Students" />
        <StatCard value={unpaidBalance} label="Unpaid Balance" prefix="₱" />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/dashboard/TrialBanner.tsx apps/web/src/app/(dashboard)/dashboard/page.tsx
git commit -m "feat(subscription): add TrialBanner countdown to dashboard"
```

---

### Task 8: Dashboard layout — locked state

**Files:**

- Modify: `apps/web/src/app/(dashboard)/layout.tsx`

When `isLocked`, render a locked message inline in the main content area instead of `{children}`. The sidebar stays visible so the coach can still log out. No separate page needed — the layout handles it directly.

- [ ] **Step 1: Update the dashboard layout**

Open `apps/web/src/app/(dashboard)/layout.tsx`. Replace the entire file with:

```tsx
import { redirect } from 'next/navigation'
import type { SubscriptionTier, SubscriptionInfo } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { Sidebar } from '@/components/dashboard/Sidebar'

type UserData = {
  name: string
  subscriptionTier: SubscriptionTier
  subscriptionStatus: string
}

function LockedState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
        Account Locked
      </p>
      <h1 className="font-outfit text-4xl font-black text-white">Your trial has ended</h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-secondary">
        Your 3-month free trial and 7-day grace period have both expired. Your data is safe —
        contact us to reactivate your account.
      </p>
      <a
        href="mailto:hello@picklecoach.com"
        className="mt-8 rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-[#0C0C10] transition-opacity hover:opacity-90"
      >
        Contact Support
      </a>
    </div>
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await serverApiFetch<UserData>('/api/v1/auth/me')
  if (!user) redirect('/login')

  const sub = await serverApiFetch<SubscriptionInfo>('/api/v1/subscriptions/me')
  const isLocked = sub?.isLocked ?? false

  return (
    <div className="flex h-screen bg-base">
      <Sidebar
        coachName={user.name}
        subscriptionTier={user.subscriptionTier}
        subscriptionStatus={user.subscriptionStatus}
      />
      <main className="flex-1 overflow-auto p-8">{isLocked ? <LockedState /> : children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(dashboard)/layout.tsx
git commit -m "feat(subscription): show locked state in dashboard layout when trial expired"
```

---

### Task 9: Browser verification

**Files:** none

- [ ] **Step 1: Start servers**

In two terminals:

```bash
# Terminal 1
cd apps/api && npm run dev

# Terminal 2
cd apps/web && npm run dev
```

- [ ] **Step 2: Verify trial countdown banner**

Navigate to `http://localhost:3000/dashboard`. The `TrialBanner` should appear above the "Dashboard" heading showing something like "89 days left in your free trial" in a subtle bordered box.

- [ ] **Step 3: Simulate near-expiry**

In MongoDB (or via a quick script), set your test coach's `trialEndsAt` to 3 days from now:

```bash
cd apps/api && node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/picklecoach').then(async () => {
  await mongoose.connection.collection('users').updateMany(
    {},
    { \$set: { trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) } }
  );
  console.log('done');
  process.exit(0);
});
"
```

Reload the dashboard. The banner should turn red and read "3 days left in your free trial".

- [ ] **Step 4: Simulate grace period**

Set `trialEndsAt` to 2 days ago:

```bash
cd apps/api && node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/picklecoach').then(async () => {
  await mongoose.connection.collection('users').updateMany(
    {},
    { \$set: { trialEndsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } }
  );
  console.log('done');
  process.exit(0);
});
"
```

Reload the dashboard. Banner reads "Trial ended — 5 days of grace period remaining" in red. All data (students, sessions) still accessible.

- [ ] **Step 5: Simulate locked state**

Set `trialEndsAt` to 10 days ago (past 7-day grace):

```bash
cd apps/api && node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/picklecoach').then(async () => {
  await mongoose.connection.collection('users').updateMany(
    {},
    { \$set: { trialEndsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } }
  );
  console.log('done');
  process.exit(0);
});
"
```

Reload the dashboard. The entire main area should show the locked state: "Account Locked / Your trial has ended / Contact Support" button. Sidebar is still visible with logout.

Try navigating to `http://localhost:4000/api/v1/students` (with cookie) — should return `403 ACCOUNT_LOCKED`.
Try navigating to `http://localhost:4000/api/v1/subscriptions/me` — should return `200` with `isLocked: true`.

- [ ] **Step 6: Restore trialEndsAt for development**

```bash
cd apps/api && node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/picklecoach').then(async () => {
  await mongoose.connection.collection('users').updateMany(
    {},
    { \$set: { trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) } }
  );
  console.log('restored');
  process.exit(0);
});
"
```

- [ ] **Step 7: Commit if any fixes were needed**

If steps 2–6 required code changes, commit them:

```bash
git add -A
git commit -m "fix: subscription UI adjustments from browser review"
```

If no fixes, skip this step.
