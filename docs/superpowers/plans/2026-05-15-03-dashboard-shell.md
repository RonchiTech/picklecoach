# Dashboard Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dashboard shell — a persistent sidebar with navigation and a home page displaying coach stats fetched from a new API endpoint.

**Architecture:** The dashboard layout is a Next.js server component that fetches the logged-in coach's data server-side and passes it to a client-side Sidebar. The Sidebar uses `usePathname()` for active nav state and handles logout via a button. Stats come from `GET /api/v1/dashboard/stats`, which returns zeros now and is wired to real data as Students (Plan 5), Sessions (Plan 6), and Payments (Plan 7) are built.

**Tech Stack:** Next.js 15 App Router (server + client components), Express.js, Mongoose, Lucide React, Tailwind CSS v4, TypeScript, Jest + Supertest

---

## File Map

**Shared**

- Modify: `packages/shared/src/types/index.ts` — add `DashboardStats` interface

**API — new module**

- Create: `apps/api/src/modules/dashboard/dashboard.service.test.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.service.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.controller.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.routes.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.integration.test.ts`
- Modify: `apps/api/src/app.ts` — mount `/api/v1/dashboard`

**Web — new files**

- Create: `apps/web/src/lib/server-api.ts` — server-side authenticated fetch utility
- Create: `apps/web/src/components/dashboard/NavItem.tsx`
- Create: `apps/web/src/components/dashboard/StatCard.tsx`
- Create: `apps/web/src/components/dashboard/Sidebar.tsx`
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`
- Modify: `apps/web/src/app/(dashboard)/page.tsx`

---

### Task 1: Add DashboardStats type to shared package

**Files:**

- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Add DashboardStats to the types file**

Open `packages/shared/src/types/index.ts` and append at the bottom:

```typescript
export interface DashboardStats {
  todaySessions: number
  totalStudents: number
  unpaidBalance: number
}
```

The full file after the change:

```typescript
export type UserRole = 'coach' | 'super_admin'

export type SubscriptionTier = 'starter' | 'pro' | 'team'

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'

export type SessionType = 'private' | 'group'

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'

export type PaymentMethod = 'cash' | 'gcash' | 'bank_transfer' | 'other'

export type PaymentStatus = 'paid' | 'unpaid' | 'partial'

export type ProgressEntryType = 'general' | 'assessment' | 'goal' | 'milestone'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

export type InquiryStatus = 'new' | 'read' | 'replied'

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface DashboardStats {
  todaySessions: number
  totalStudents: number
  unpaidBalance: number
}
```

- [ ] **Step 2: Rebuild shared package**

```bash
pnpm --filter shared build
```

Expected: No errors. `dist/` files regenerated.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/index.ts packages/shared/dist/
git commit -m "feat: add DashboardStats type to shared package"
```

---

### Task 2: serverApiFetch utility (web)

**Files:**

- Create: `apps/web/src/lib/server-api.ts`

This utility makes authenticated API calls from Next.js server components by reading the `token` cookie and forwarding it in the `Cookie` header. The client-side `apiFetch` (in `lib/api.ts`) uses `credentials: 'include'` which only works in the browser — server components need this explicit cookie forwarding.

- [ ] **Step 1: Create server-api.ts**

```bash
cat << 'EOF' > apps/web/src/lib/server-api.ts
import { getAuthToken } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function serverApiFetch<T>(path: string): Promise<T | null> {
  const token = await getAuthToken()
  if (!token) return null
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Cookie: `token=${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = (await res.json()) as { data: T }
  return data.data
}
EOF
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/server-api.ts
git commit -m "feat: add serverApiFetch utility for authenticated server-side requests"
```

---

### Task 3: Dashboard service (TDD)

**Files:**

- Create: `apps/api/src/modules/dashboard/dashboard.service.test.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.service.ts`

- [ ] **Step 1: Write the failing test**

```bash
mkdir -p apps/api/src/modules/dashboard

cat << 'EOF' > apps/api/src/modules/dashboard/dashboard.service.test.ts
import { DashboardService } from './dashboard.service'

let service: DashboardService

beforeEach(() => {
  service = new DashboardService()
})

describe('DashboardService.getStats', () => {
  it('returns zero stats when no data exists', async () => {
    const stats = await service.getStats('any-coach-id')
    expect(stats).toEqual({
      todaySessions: 0,
      totalStudents: 0,
      unpaidBalance: 0,
    })
  })

  it('returns numbers for all three stat fields', async () => {
    const stats = await service.getStats('coach-123')
    expect(typeof stats.todaySessions).toBe('number')
    expect(typeof stats.totalStudents).toBe('number')
    expect(typeof stats.unpaidBalance).toBe('number')
  })
})
EOF
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
cd apps/api && node_modules/.bin/jest dashboard.service.test --no-coverage
```

Expected: FAIL with `Cannot find module './dashboard.service'`

- [ ] **Step 3: Write the minimal implementation**

```bash
cat << 'EOF' > apps/api/src/modules/dashboard/dashboard.service.ts
import type { DashboardStats } from '@picklecoach/shared'

export class DashboardService {
  async getStats(_coachId: string): Promise<DashboardStats> {
    return { todaySessions: 0, totalStudents: 0, unpaidBalance: 0 }
  }
}
EOF
```

- [ ] **Step 4: Run the test — verify it passes**

```bash
cd apps/api && node_modules/.bin/jest dashboard.service.test --no-coverage
```

Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/dashboard/
git commit -m "feat: add DashboardService with stub getStats method (TDD)"
```

---

### Task 4: Dashboard controller + routes

**Files:**

- Create: `apps/api/src/modules/dashboard/dashboard.controller.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create the controller**

```bash
cat << 'EOF' > apps/api/src/modules/dashboard/dashboard.controller.ts
import type { Request, Response, NextFunction } from 'express'
import { DashboardService } from './dashboard.service'

export class DashboardController {
  constructor(private service: DashboardService) {}

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getStats(req.user!.userId)
      res.json({ success: true, data: stats })
    } catch (err) {
      next(err)
    }
  }
}
EOF
```

- [ ] **Step 2: Create the routes**

```bash
cat << 'EOF' > apps/api/src/modules/dashboard/dashboard.routes.ts
import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import { DashboardService } from './dashboard.service'
import { DashboardController } from './dashboard.controller'

const router = Router()
const service = new DashboardService()
const controller = new DashboardController(service)

router.get('/stats', authenticate, controller.getStats)

export { router as dashboardRoutes }
EOF
```

- [ ] **Step 3: Mount dashboard route in app.ts**

Replace `apps/api/src/app.ts` with:

```bash
cat << 'EOF' > apps/api/src/app.ts
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorMiddleware } from './middleware/error.middleware'
import { notFoundMiddleware } from './middleware/notFound.middleware'
import { authRoutes } from './modules/auth/auth.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { env } from './config/env'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } })
  })

  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/dashboard', dashboardRoutes)

  app.use(notFoundMiddleware)
  app.use(errorMiddleware)

  return app
}
EOF
```

- [ ] **Step 4: TypeScript check**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/dashboard/ apps/api/src/app.ts
git commit -m "feat: add dashboard controller, routes, mount at /api/v1/dashboard"
```

---

### Task 5: Dashboard integration test

**Files:**

- Create: `apps/api/src/modules/dashboard/dashboard.integration.test.ts`

- [ ] **Step 1: Write the integration test**

```bash
cat << 'EOF' > apps/api/src/modules/dashboard/dashboard.integration.test.ts
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

async function loginAndGetCookie(): Promise<string[]> {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Coach Ron', email: 'ron@test.com', password: 'password123' })
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'ron@test.com', password: 'password123' })
  return res.headers['set-cookie'] as unknown as string[]
}

describe('GET /api/v1/dashboard/stats', () => {
  it('returns 401 NOT_AUTHENTICATED without a token', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('NOT_AUTHENTICATED')
  })

  it('returns 200 with stats shape for authenticated coach', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.data.todaySessions).toBe('number')
    expect(typeof res.body.data.totalStudents).toBe('number')
    expect(typeof res.body.data.unpaidBalance).toBe('number')
  })

  it('returns zero counts when no sessions, students, or payments exist', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Cookie', cookie)

    expect(res.body.data).toEqual({
      todaySessions: 0,
      totalStudents: 0,
      unpaidBalance: 0,
    })
  })
})
EOF
```

- [ ] **Step 2: Run the integration test — verify it passes**

```bash
cd apps/api && node_modules/.bin/jest dashboard.integration.test --no-coverage --runInBand
```

Expected: PASS — 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/dashboard/dashboard.integration.test.ts
git commit -m "test: add dashboard stats integration tests"
```

---

### Task 6: NavItem + StatCard components

**Files:**

- Create: `apps/web/src/components/dashboard/NavItem.tsx`
- Create: `apps/web/src/components/dashboard/StatCard.tsx`

- [ ] **Step 0: Install lucide-react**

```bash
pnpm --filter web add lucide-react
```

Expected: `lucide-react` appears in `apps/web/package.json` under `dependencies`.

- [ ] **Step 1: Create NavItem**

NavItem is a client component — it calls `usePathname()` to detect the active route. The active item gets Electric Lime styling. Any path under `/dashboard/students` will activate the Students nav item.

```bash
mkdir -p apps/web/src/components/dashboard

cat << 'EOF' > apps/web/src/components/dashboard/NavItem.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

type NavItemProps = {
  href: string
  label: string
  Icon: LucideIcon
}

export function NavItem({ href, label, Icon }: NavItemProps) {
  const pathname = usePathname()
  const isActive =
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
        isActive
          ? 'bg-accent/10 font-semibold text-accent'
          : 'font-dm text-text-secondary hover:bg-surface hover:text-text-primary'
      }`}
    >
      <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
      {label}
    </Link>
  )
}
EOF
```

- [ ] **Step 2: Create StatCard**

StatCard renders a large Whoop-style number above a small uppercase label.

```bash
cat << 'EOF' > apps/web/src/components/dashboard/StatCard.tsx
type StatCardProps = {
  value: number
  label: string
  prefix?: string
}

export function StatCard({ value, label, prefix = '' }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <p className="font-outfit text-6xl font-extralight text-text-primary">
        {prefix}
        {value.toLocaleString()}
      </p>
      <p className="mt-3 font-dm text-xs font-semibold uppercase tracking-widest text-text-secondary">
        {label}
      </p>
    </div>
  )
}
EOF
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/
git commit -m "feat: add NavItem and StatCard dashboard components"
```

---

### Task 7: Sidebar component

**Files:**

- Create: `apps/web/src/components/dashboard/Sidebar.tsx`

The Sidebar is a client component because it uses `useRouter` (for the logout redirect) and renders NavItem (which uses `usePathname`). The server layout fetches the coach's name + tier and passes them as serializable props.

- [ ] **Step 1: Create Sidebar**

```bash
cat << 'EOF' > apps/web/src/components/dashboard/Sidebar.tsx
'use client'

import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  UserCircle,
} from 'lucide-react'
import type { SubscriptionTier } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'
import { NavItem } from './NavItem'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/dashboard/students', label: 'Students', Icon: Users },
  { href: '/dashboard/sessions', label: 'Sessions', Icon: CalendarDays },
  { href: '/dashboard/payments', label: 'Payments', Icon: CreditCard },
  { href: '/dashboard/profile', label: 'Profile', Icon: UserCircle },
]

const TIER_LABELS: Record<SubscriptionTier, string> = {
  starter: 'Starter',
  pro: 'Pro',
  team: 'Team',
}

type SidebarProps = {
  coachName: string
  subscriptionTier: SubscriptionTier
  subscriptionStatus: string
}

export function Sidebar({ coachName, subscriptionTier, subscriptionStatus }: SidebarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-52 flex-shrink-0 flex-col border-r border-border bg-base px-3 py-5">
      <div className="mb-8 px-3">
        <span className="font-outfit text-xl font-bold text-accent">PickleCoach</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-text-primary">{coachName}</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            {TIER_LABELS[subscriptionTier]}
            {subscriptionStatus === 'trial' && ' · Trial'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:border-error hover:text-error"
        >
          Log out
        </button>
      </div>
    </aside>
  )
}
EOF
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/Sidebar.tsx
git commit -m "feat: add Sidebar component with nav, coach info, and logout"
```

---

### Task 8: Update dashboard layout + page

**Files:**

- Modify: `apps/web/src/app/(dashboard)/layout.tsx`
- Modify: `apps/web/src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Update the dashboard layout**

The layout fetches the coach's user data server-side using `serverApiFetch`. If the fetch returns null (expired or missing token), it redirects to `/login`. The middleware in `middleware.ts` already handles unauthenticated redirects, but this is a safety net and also fetches the data we need.

```bash
cat << 'EOF' > apps/web/src/app/\(dashboard\)/layout.tsx
import { redirect } from 'next/navigation'
import type { SubscriptionTier } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { Sidebar } from '@/components/dashboard/Sidebar'

type UserData = {
  name: string
  subscriptionTier: SubscriptionTier
  subscriptionStatus: string
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await serverApiFetch<UserData>('/api/v1/auth/me')
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-base">
      <Sidebar
        coachName={user.name}
        subscriptionTier={user.subscriptionTier}
        subscriptionStatus={user.subscriptionStatus}
      />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
EOF
```

- [ ] **Step 2: Update the dashboard page**

```bash
cat << 'EOF' > apps/web/src/app/\(dashboard\)/page.tsx
import type { DashboardStats } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { StatCard } from '@/components/dashboard/StatCard'

export default async function DashboardPage() {
  const stats = await serverApiFetch<DashboardStats>('/api/v1/dashboard/stats')

  const todaySessions = stats?.todaySessions ?? 0
  const totalStudents = stats?.totalStudents ?? 0
  const unpaidBalance = stats?.unpaidBalance ?? 0

  return (
    <div>
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
EOF
```

- [ ] **Step 3: TypeScript check (web)**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/
git commit -m "feat: update dashboard layout with Sidebar and page with StatCards"
```

---

### Task 9: Manual browser verification

**Prerequisites:** MongoDB must be running. Run `brew services list | grep mongodb` to confirm. If not started: `brew services start mongodb/brew/mongodb-community@8.0`

- [ ] **Step 1: Start the API server**

In one terminal:

```bash
pnpm dev:api
```

Expected: `Server running on port 4000`

- [ ] **Step 2: Start the web server**

In another terminal:

```bash
pnpm dev:web
```

Expected: Next.js dev server on `http://localhost:3000`

- [ ] **Step 3: Verify register → dashboard flow**

1. Navigate to `http://localhost:3000/register`
2. Register with any valid name, email, password
3. After successful registration, verify automatic redirect to `/dashboard`
4. Confirm sidebar shows: **PickleCoach** logo in Electric Lime, five nav items (Dashboard, Students, Sessions, Payments, Profile)
5. Confirm **Dashboard** nav item is highlighted with Electric Lime background tint and bold text
6. Confirm coach name + "Starter · Trial" label at sidebar bottom
7. Confirm 3 stat cards showing: `0 / SESSIONS TODAY`, `0 / TOTAL STUDENTS`, `₱0 / UNPAID BALANCE`
8. Confirm stat numbers use the thin Outfit font (Whoop-style large numerals)

- [ ] **Step 4: Verify sidebar navigation**

1. Click **Students** in the sidebar
2. Verify URL changes to `/dashboard/students` and a 404 page shows (page not built yet)
3. Verify **Students** nav item is now highlighted, **Dashboard** is not
4. Click **Dashboard** — verify return to dashboard and active state resets

- [ ] **Step 5: Verify logout**

1. Click **Log out** button in sidebar
2. Verify redirect to `/login`
3. Navigate to `http://localhost:3000/dashboard`
4. Verify automatic redirect to `/login` (middleware protecting the route)

- [ ] **Step 6: Verify login → redirect when already authenticated**

1. Log in via `/login`
2. While the cookie is active, navigate to `http://localhost:3000/login`
3. Verify automatic redirect to `/dashboard`

- [ ] **Step 7: Final commit**

```bash
git add -A
git status
```

If there are uncommitted changes (e.g. lock file changes), commit them:

```bash
git commit -m "chore: dashboard shell complete — sidebar, stats, layout verified"
```

---

## What comes next

Plan 4 will build the Student module: `GET /students`, `POST /students`, `PATCH /students/:id`, `DELETE /students/:id` on the API, and the Students list page + Add Student form in the dashboard. The sidebar's Students nav item already links to `/dashboard/students`.
