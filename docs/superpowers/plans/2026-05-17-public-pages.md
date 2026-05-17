# Public Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/` landing page — Hero, Stats, Features, Pricing (anchored `#pricing`), CTA band, Footer — replacing the current "Coming soon" placeholder. No separate `/pricing` route.

**Architecture:** Two new shared components (`MarketingNav`, `MarketingFooter`) live in `components/marketing/` and are mounted in a new `(marketing)/layout.tsx`. The landing page content lives entirely in `(marketing)/page.tsx` as a static server component; a `DashboardPreview` sub-component is extracted because it is complex markup used only in the hero. All pages are server components — no `'use client'` needed.

**Tech Stack:** Next.js 15 App Router · TypeScript · Tailwind CSS v4 (custom tokens: `bg-base`, `bg-surface`, `border-border`, `text-accent`, `text-muted`, `text-text-secondary`, `font-outfit`, `font-dm`) · next/link

---

## File Map

| Action | Path                                                     | Responsibility                          |
| ------ | -------------------------------------------------------- | --------------------------------------- |
| Create | `apps/web/src/components/marketing/MarketingNav.tsx`     | Top nav (logo, links, CTAs)             |
| Create | `apps/web/src/components/marketing/MarketingFooter.tsx`  | Footer (logo, links, copyright)         |
| Create | `apps/web/src/components/marketing/DashboardPreview.tsx` | Decorative dashboard widget in hero     |
| Create | `apps/web/src/app/(marketing)/layout.tsx`                | Wraps marketing pages with Nav + Footer |
| Modify | `apps/web/src/app/(marketing)/page.tsx`                  | Full landing page                       |

---

## Task 1: MarketingNav

**Files:**

- Create: `apps/web/src/components/marketing/MarketingNav.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/marketing/MarketingNav.tsx
import Link from 'next/link'

export default function MarketingNav() {
  return (
    <nav className="flex items-center justify-between px-14 py-5 border-b border-border">
      <Link href="/" className="font-outfit text-xl font-black tracking-tight">
        Pickle<span className="text-accent">Coach</span>
      </Link>
      <div className="flex gap-8">
        <Link href="/coaches" className="text-sm text-muted hover:text-white transition-colors">
          Find a Coach
        </Link>
        <a href="#pricing" className="text-sm text-muted hover:text-white transition-colors">
          Pricing
        </a>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm text-muted hover:text-white transition-colors">
          Log in
        </Link>
        <Link
          href="/register"
          className="bg-accent text-[#0C0C10] text-sm font-bold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Start free →
        </Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/marketing/MarketingNav.tsx
git commit -m "feat: add MarketingNav component"
```

---

## Task 2: MarketingFooter

**Files:**

- Create: `apps/web/src/components/marketing/MarketingFooter.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/marketing/MarketingFooter.tsx
import Link from 'next/link'

export default function MarketingFooter() {
  return (
    <footer className="border-t border-border px-14 py-7 flex justify-between items-center">
      <span className="font-outfit font-black">
        Pickle<span className="text-accent">Coach</span>
      </span>
      <div className="flex gap-5">
        <Link href="/coaches" className="text-xs text-[#333] hover:text-muted transition-colors">
          Find a Coach
        </Link>
        <a href="#pricing" className="text-xs text-[#333] hover:text-muted transition-colors">
          Pricing
        </a>
        <Link href="/privacy" className="text-xs text-[#333] hover:text-muted transition-colors">
          Privacy
        </Link>
        <Link href="/terms" className="text-xs text-[#333] hover:text-muted transition-colors">
          Terms
        </Link>
      </div>
      <span className="text-xs text-[#2a2a2a]">© 2026 PickleCoach</span>
    </footer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/marketing/MarketingFooter.tsx
git commit -m "feat: add MarketingFooter component"
```

---

## Task 3: Marketing layout

**Files:**

- Create: `apps/web/src/app/(marketing)/layout.tsx`

- [ ] **Step 1: Create the layout**

```tsx
// apps/web/src/app/(marketing)/layout.tsx
import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
```

- [ ] **Step 2: Smoke test**

Run the dev server and open `http://localhost:3000`. You should see the current "Coming soon" text wrapped inside the nav and footer. If the nav and footer appear, this task is done.

```bash
cd apps/web && pnpm dev
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(marketing\)/layout.tsx
git commit -m "feat: add marketing layout with nav and footer"
```

---

## Task 4: DashboardPreview component

**Files:**

- Create: `apps/web/src/components/marketing/DashboardPreview.tsx`

This is a purely decorative widget — no props, no interactivity. It mimics the app's real dashboard UI to give visitors a visual impression of the product.

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/marketing/DashboardPreview.tsx
export default function DashboardPreview() {
  return (
    <div
      className="bg-surface border border-border rounded-2xl overflow-hidden mt-2"
      style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,241,53,0.06)' }}
    >
      {/* Title bar */}
      <div className="bg-[#0C0C10] border-b border-border px-5 py-3 flex gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-error" />
        <span className="w-2.5 h-2.5 rounded-full bg-warning" />
        <span className="w-2.5 h-2.5 rounded-full bg-success" />
      </div>

      {/* Body */}
      <div className="flex" style={{ minHeight: '280px' }}>
        {/* Sidebar */}
        <div className="w-14 bg-[#0C0C10] border-r border-[#1a1a24] py-3.5 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent" />
          <div className="w-8 h-8 rounded-lg bg-surface" />
          <div className="w-8 h-8 rounded-lg bg-surface" />
          <div className="w-8 h-8 rounded-lg bg-surface" />
        </div>

        {/* Main */}
        <div className="flex-1 p-4">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Today', value: '3', sub: 'sessions', accent: false },
              { label: 'Students', value: '18', sub: 'active', accent: false },
              { label: 'Unpaid', value: '₱2,400', sub: 'balance', accent: true },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0C0C10] border border-border rounded-lg p-3">
                <p className="text-[10px] text-[#444] uppercase tracking-wide mb-1">{stat.label}</p>
                <p
                  className={'font-outfit text-xl font-bold' + (stat.accent ? ' text-accent' : '')}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] text-[#444]">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Session list */}
          <div className="bg-[#0C0C10] border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex justify-between">
              <span className="text-[10px] text-[#444] uppercase tracking-wide">
                Recent sessions
              </span>
              <span className="text-[10px] text-[#444] uppercase tracking-wide">Status</span>
            </div>
            {sessions.map((s, i) => (
              <div
                key={s.name}
                className={
                  'px-3 py-2.5 flex justify-between items-center' +
                  (i < sessions.length - 1 ? ' border-b border-white/[0.03]' : '')
                }
              >
                <div>
                  <p className="text-xs font-medium">{s.name}</p>
                  <p className="text-[10px] text-[#444]">{s.sub}</p>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: s.badgeBg, color: s.badgeColor }}
                >
                  {s.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const sessions = [
  {
    name: 'Maria Santos',
    sub: 'Private · 60 min',
    badge: 'Scheduled',
    badgeBg: 'rgba(200,241,53,0.1)',
    badgeColor: '#C8F135',
  },
  {
    name: 'Group Session A',
    sub: 'Group · 4 students',
    badge: 'Completed',
    badgeBg: 'rgba(34,197,94,0.1)',
    badgeColor: '#22c55e',
  },
  {
    name: 'Juan dela Cruz',
    sub: 'Private · 90 min',
    badge: '₱500 due',
    badgeBg: 'rgba(255,107,107,0.1)',
    badgeColor: '#ff6b6b',
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/marketing/DashboardPreview.tsx
git commit -m "feat: add DashboardPreview decorative component"
```

---

## Task 5: Landing page

**Files:**

- Modify: `apps/web/src/app/(marketing)/page.tsx`

Replace the entire file content. This is a server component — no `'use client'` directive.

- [ ] **Step 1: Replace page.tsx**

```tsx
// apps/web/src/app/(marketing)/page.tsx
import Link from 'next/link'
import DashboardPreview from '@/components/marketing/DashboardPreview'

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="px-14 pt-[72px] grid grid-cols-[1fr_460px] gap-16 items-start max-w-[1200px] mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-[7px] h-[7px] bg-accent rounded-full" />
            <span className="text-[11px] text-muted uppercase tracking-[0.04em] font-medium">
              90-day free trial · No credit card
            </span>
          </div>
          <h1 className="font-outfit text-[4rem] font-black leading-none tracking-[-0.03em] mb-5">
            Coaching,
            <br />
            not
            <br />
            <span className="text-accent">paperwork.</span>
          </h1>
          <p className="text-muted text-base leading-relaxed mb-9 max-w-[420px]">
            PickleCoach helps Filipino pickleball coaches manage students, sessions, and payments —
            all in one place.
          </p>
          <div className="flex gap-2.5 mb-3">
            <Link
              href="/register"
              className="bg-accent text-[#0C0C10] font-black text-sm px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Start free trial
            </Link>
            <a
              href="#pricing"
              className="bg-white/5 border border-white/[0.08] text-text-secondary font-semibold text-sm px-5 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              View pricing
            </a>
            <Link
              href="/coaches"
              className="bg-white/5 border border-white/[0.08] text-text-secondary font-semibold text-sm px-5 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              Find a coach
            </Link>
          </div>
          <p className="text-xs text-[#444]">
            Free for <span className="text-[#666] font-semibold">90 days</span> · No credit card ·
            Cancel anytime
          </p>
        </div>
        <DashboardPreview />
      </section>

      {/* ── STATS STRIP ──────────────────────────────────── */}
      <div className="border-y border-border px-14 py-7 flex justify-center gap-[72px] mt-[72px]">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-outfit text-[1.8rem] font-black text-accent tracking-[-0.03em]">
              {s.value}
            </p>
            <p className="text-xs text-[#444] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="px-14 pt-20 pb-16 max-w-[1200px] mx-auto">
        <p className="text-xs text-muted uppercase tracking-[0.08em] font-semibold mb-4">
          What's included
        </p>
        <h2 className="font-outfit text-[2.4rem] font-black tracking-[-0.03em] leading-[1.1] max-w-[460px] mb-3">
          Stop managing your coaching with group chats.
        </h2>
        <p className="text-muted text-sm max-w-[340px] leading-relaxed mb-10">
          Students, sessions, and payments — consolidated into one clean dashboard.
        </p>
        <div className="flex flex-col gap-0.5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="grid grid-cols-[40px_1fr_auto] gap-5 items-start px-7 py-6 rounded-xl border border-transparent hover:bg-surface hover:border-border transition-colors"
            >
              <span className="font-outfit text-xs text-[#333] font-bold pt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-bold tracking-[-0.01em] mb-1">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.description}</p>
              </div>
              <span className="self-center text-[11px] text-accent bg-accent/10 px-3 py-0.5 rounded-full font-semibold whitespace-nowrap">
                Available now
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section id="pricing" className="px-14 pb-20 max-w-[1200px] mx-auto">
        <div className="h-px bg-border mb-16" />
        <p className="text-xs text-muted uppercase tracking-[0.08em] font-semibold mb-4">Pricing</p>
        <h2 className="font-outfit text-[2.4rem] font-black tracking-[-0.03em] leading-[1.1] mb-2.5">
          Straight talk.
          <br />
          No surprises.
        </h2>
        <p className="text-muted text-sm max-w-[420px] leading-relaxed mb-10">
          Start free for 90 days on Starter. No credit card. Upgrade to Pro when it launches —
          cancel whenever you want.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-[680px] mb-7">
          {/* Starter */}
          <div className="bg-surface border border-border rounded-2xl p-7">
            <p className="text-xs text-muted uppercase tracking-[0.08em] font-semibold mb-3">
              Starter
            </p>
            <p className="font-outfit text-[2.6rem] font-black tracking-[-0.04em] leading-none">
              ₱99
            </p>
            <p className="text-xs text-[#444] mt-1 mb-4">per month after trial</p>
            <p className="text-sm text-muted leading-relaxed pb-4 border-b border-white/5 mb-4">
              Everything you need to run your coaching business today.
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              {starterFeatures.map((f) => (
                <li key={f} className="flex gap-2 items-baseline text-sm text-[#888]">
                  <span className="text-[#2a2a2a] shrink-0">—</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block text-center py-3 rounded-xl font-bold text-sm border border-border text-[#666] hover:border-muted hover:text-white transition-colors"
            >
              Start free trial
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-surface border border-accent rounded-2xl p-7 relative">
            <span className="absolute -top-[11px] left-6 bg-accent text-[#0C0C10] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.06em]">
              Coming soon
            </span>
            <p className="text-xs text-accent uppercase tracking-[0.08em] font-semibold mb-3">
              Pro
            </p>
            <p className="font-outfit text-[2.6rem] font-black tracking-[-0.04em] leading-none">
              ₱299
            </p>
            <p className="text-xs text-[#444] mt-1 mb-4">per month after trial</p>
            <p className="text-sm text-muted leading-relaxed pb-4 border-b border-white/5 mb-4">
              Everything in Starter, plus advanced tools as they launch.
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              <li className="flex gap-2 items-baseline text-sm text-text-secondary">
                <span className="text-accent shrink-0">✓</span> Everything in Starter
              </li>
              {proFeatures.map((f) => (
                <li
                  key={f}
                  className="flex gap-2 items-baseline text-sm text-text-secondary opacity-45"
                >
                  <span className="text-accent shrink-0">✓</span>
                  {f}
                  <span className="text-[11px] text-muted">· soon</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block text-center py-3 rounded-xl font-bold text-sm bg-accent text-[#0C0C10] hover:opacity-90 transition-opacity"
            >
              Join waitlist
            </Link>
          </div>
        </div>

        <p className="text-xs text-[#333] leading-[1.8] max-w-[560px]">
          All plans include a <strong className="text-[#555]">90-day free trial on Starter</strong>{' '}
          — no credit card required. Pro features are in development and will roll out to Pro
          subscribers first. Items marked <em>soon</em> are not yet available. After your trial,
          accounts that remain unpaid are locked for 7 days, then archived. Your data is preserved —
          reactivate anytime.
        </p>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────── */}
      <div className="mx-14 mb-20 bg-accent rounded-[18px] px-14 py-12 flex justify-between items-center gap-8">
        <div>
          <h2 className="font-outfit text-[2rem] font-black text-[#0C0C10] tracking-[-0.03em] leading-[1.1] max-w-[380px]">
            Ready? 90 days on us.
          </h2>
          <p className="text-[#0C0C10]/60 mt-2 text-sm">
            No credit card. No commitment. Just less chaos.
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <Link
            href="/register"
            className="bg-[#0C0C10] text-white font-bold text-sm px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Start free trial →
          </Link>
          <Link
            href="/coaches"
            className="bg-[#0C0C10]/[0.12] text-[#0C0C10] font-semibold text-sm px-5 py-3.5 rounded-xl hover:bg-[#0C0C10]/20 transition-colors"
          >
            Find a coach
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

const stats = [
  { value: '90', label: 'days free, no card needed' },
  { value: '₱99', label: 'per month after trial' },
  { value: '3', label: 'tools in one dashboard' },
]

const features = [
  {
    title: 'Student roster',
    description:
      'Track every student — skill level, contact info, and notes. No more digging through Messenger.',
  },
  {
    title: 'Session scheduling',
    description:
      "Log private and group sessions. Mark completed or cancelled. See today's lineup the moment you open the app.",
  },
  {
    title: 'Payment tracking',
    description:
      "Cash, GCash, bank transfer — record it all. Know exactly who's paid and who owes, without asking.",
  },
  {
    title: 'Public coach profile',
    description:
      'Get listed in the PickleCoach directory. Share your rates, specializations, and contact info with potential students.',
  },
]

const starterFeatures = [
  'Unlimited students',
  'Session scheduling',
  'Payment tracking',
  'Public coach profile',
  'Coach directory listing',
]

const proFeatures = [
  'Student progress log',
  'Session notes',
  'Payment reports',
  'Email reminders',
  'Profile analytics',
]
```

- [ ] **Step 2: Start dev server and verify visually**

```bash
cd apps/web && pnpm dev
```

Open `http://localhost:3000` and verify:

- Nav appears at top with logo, links, and CTAs
- Hero shows headline, 3 buttons, and dashboard preview side-by-side
- Stats strip shows 90 / ₱99 / 3 across the full width
- Features section shows 4 numbered rows with "Available now" tags
- Clicking "View pricing" or the nav "Pricing" link scrolls to the pricing section
- Starter and Pro cards render side-by-side; Pro has the "Coming soon" badge
- CTA band is lime with dark text and two buttons
- Footer appears at the bottom

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(marketing\)/page.tsx
git commit -m "feat: build landing page with hero, features, and pricing"
```
