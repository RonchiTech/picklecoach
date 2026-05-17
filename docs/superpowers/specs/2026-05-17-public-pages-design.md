# Public Pages Design — Landing & Pricing

**Date:** 2026-05-17  
**Status:** Approved  
**Scope:** `/` landing page only. No separate `/pricing` route — pricing is an anchored section on the landing page.

---

## Route Structure

| Route       | Component              | Notes                      |
| ----------- | ---------------------- | -------------------------- |
| `/`         | `(marketing)/page.tsx` | Full single-page layout    |
| `/#pricing` | —                      | Anchor within landing page |

The `/pricing` nav link and all "View pricing" CTAs scroll to `#pricing` on the same page.

---

## Page Layout (top → bottom)

1. **Nav** — Logo · Find a Coach · Pricing (anchor) · Log in · Start free →
2. **Hero** — Left-aligned headline + 3 CTAs + right dashboard preview widget
3. **Stats strip** — 3 callout numbers (90 days / ₱99 / 3 tools)
4. **Features** — Numbered list, 4 items, all tagged "Available now"
5. **Pricing** — 2 cards (Starter + Pro), anchored at `id="pricing"`
6. **CTA band** — Lime background, final sign-up push
7. **Footer** — Logo · Find a Coach · Pricing · Privacy · Terms · © 2026

---

## Hero Section

**Headline:** "Coaching, not paperwork."  
**Subtext:** "PickleCoach helps Filipino pickleball coaches manage students, sessions, and payments — all in one place."

**CTAs (3):**

- "Start free trial" — lime primary → `/register`
- "View pricing" — ghost → `#pricing` anchor
- "Find a coach" — ghost → `/coaches`

**Fine print:** "Free for 90 days · No credit card · Cancel anytime"

**Right column:** Dashboard preview widget (mockup — not interactive) showing stat cards and a session list.

---

## Features Section

Only features currently built. No invented roadmap items here.

| #   | Title                | Description                                                              |
| --- | -------------------- | ------------------------------------------------------------------------ |
| 01  | Student roster       | Track every student — skill level, contact info, and notes.              |
| 02  | Session scheduling   | Log private and group sessions. See today's lineup at a glance.          |
| 03  | Payment tracking     | Record cash, GCash, bank transfer. Know who's paid and who owes.         |
| 04  | Public coach profile | Get listed in the directory. Share rates, specializations, contact info. |

All tagged: **Available now**

---

## Pricing Section

**Header:** "Straight talk. No surprises."  
**Subtext:** "Start free for 90 days on Starter. No credit card. Upgrade to Pro when it launches."

### Starter — ₱99/mo

- Unlimited students
- Session scheduling
- Payment tracking
- Public coach profile
- Coach directory listing

**CTA:** "Start free trial" (outline style)

### Pro — ₱299/mo _(Coming soon badge)_

Everything in Starter, plus (all marked `· soon`):

- Student progress log
- Session notes
- Payment reports
- Email reminders
- Profile analytics

**CTA:** "Join waitlist" (lime — no signup flow yet)

### Fine print

> All plans include a 90-day free trial on Starter — no credit card required. Pro features are in development and will roll out to Pro subscribers first. Items marked _soon_ are not yet available. After your trial, accounts that remain unpaid are locked for 7 days, then archived. Your data is preserved — reactivate anytime.

---

## Subscription & Trial Rules

- New coaches: `subscriptionStatus: 'trial'`, `trialEndsAt: now + 90 days`
- After trial: 7-day grace period → hard lock → archived (data preserved)
- Enforcement: not yet implemented (planned for Pro Tier plan)
- Starter is the only purchasable tier for now; Pro is waitlist-only

---

## Design System

| Token        | Value            |
| ------------ | ---------------- |
| Base         | `#0C0C10`        |
| Surface      | `#16161E`        |
| Border       | `#22222E`        |
| Accent       | `#C8F135` (lime) |
| Heading font | Outfit (800/900) |
| Body font    | DM Sans          |

---

## Implementation Scope

**Frontend only — no new backend changes needed.**

Files to create/modify:

- `apps/web/src/app/(marketing)/layout.tsx` — shared nav + footer
- `apps/web/src/app/(marketing)/page.tsx` — replace "Coming soon" with full landing

No new API routes. The `/coaches` directory (already built) powers the "Find a coach" CTA destination.
