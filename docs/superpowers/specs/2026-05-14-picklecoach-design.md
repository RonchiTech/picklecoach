# PickleCoach — Product Design Spec

**Date:** 2026-05-14
**Status:** Approved

---

## 1. Product Overview

PickleCoach is a SaaS platform for independent pickleball coaches to manage their business — scheduling, student management, payment tracking, and progress logging. The platform is coach-centric: coaches pay for the subscription, students need no account.

**Primary user:** Solo independent pickleball coach (Philippines-based, MVP)
**Future users:** Club coaches (B), Academy owners / multi-coach orgs (C)
**Currency:** Philippine Peso (PHP)
**Trial period:** 3 months free on registration

---

## 2. User Roles

### In-App Roles

| Role          | Description                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `coach`       | Primary paying user. Manages their own students, sessions, and payments.                            |
| `super_admin` | Platform owner (creator). Full visibility across all coaches, manages subscriptions and promotions. |

### AI Development Personas (CLAUDE.md)

Invokable in any Claude Code session to focus the right kind of thinking per phase:

| Invoke                | Role               | Responsibility                                                                  |
| --------------------- | ------------------ | ------------------------------------------------------------------------------- |
| `@project-manager`    | Project Manager    | Breaks features into tasks, decides build order, hands off to the right persona |
| `@researcher`         | Researcher         | Investigates libraries, competitors, best practices before building             |
| `@ui-ux-expert`       | UI/UX Expert       | Designs distinctive, non-generic interfaces — no default AI aesthetics          |
| `@backend-architect`  | Backend Architect  | Schema decisions, API design, OOP patterns, MongoDB modeling                    |
| `@frontend-developer` | Frontend Developer | Implements designs from UI/UX Expert using Next.js + Tailwind                   |
| `@qa-engineer`        | QA Engineer        | Writes test cases, edge cases, security review                                  |

---

## 3. Pricing & Subscriptions

Tiers are **feature-gated**, not usage-gated (student count is unverifiable and private).

| Tier        | Price                 | Key Features                                         |
| ----------- | --------------------- | ---------------------------------------------------- |
| **Starter** | Free trial -> P499/mo | Booking, student management, manual payment tracking |
| **Pro**     | P999/mo               | + Progress logs, email reminders, payment reports    |
| **Team**    | P1,999/mo             | + Multi-coach accounts, staff management (future)    |

**Promotions:** Super admin can create promo codes with:

- Discount type: percentage or fixed (PHP value)
- Expiry by date and/or by max number of redemptions (either or both)
- Applicable to specific tiers

---

## 4. Tech Stack

| Layer                 | Choice                                               |
| --------------------- | ---------------------------------------------------- |
| Monorepo              | pnpm workspaces                                      |
| Frontend              | Next.js 15 (App Router) + TypeScript                 |
| Backend               | Express.js + TypeScript                              |
| Database              | MongoDB (Mongoose ODM)                               |
| Shared                | Zod schemas + TypeScript types (packages/shared)     |
| Auth                  | JWT + bcrypt (httpOnly cookies)                      |
| Validation            | Zod                                                  |
| Styling               | Tailwind CSS v4 + shadcn/ui (custom theme)           |
| Media / Image storage | Cloudinary (signed upload URLs, auto-transform)      |
| Email                 | Resend                                               |
| Testing               | Jest + Supertest (API), Vitest + RTL (frontend)      |
| Deployment            | Vercel (frontend), Railway (API), MongoDB Atlas (DB) |

---

## 5. Monorepo Structure

```
picklecoach/
├── apps/
│   ├── web/                    <- Next.js 15 (App Router)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (marketing)/    <- landing page, pricing
│   │       │   ├── (auth)/         <- login, register
│   │       │   ├── (dashboard)/    <- coach dashboard (protected)
│   │       │   └── (admin)/        <- super admin panel (protected)
│   │       ├── components/
│   │       │   ├── ui/             <- shadcn base components (customized)
│   │       │   └── [feature]/      <- feature-specific components
│   │       ├── lib/
│   │       │   ├── api.ts          <- typed API client
│   │       │   └── auth.ts
│   │       └── hooks/
│   └── api/                    <- Express.js + TypeScript
│       └── src/
│           ├── modules/
│           │   ├── coach/
│           │   │   ├── coach.routes.ts
│           │   │   ├── coach.controller.ts
│           │   │   ├── coach.service.ts
│           │   │   ├── coach.repository.ts
│           │   │   ├── coach.model.ts
│           │   │   └── coach.test.ts
│           │   ├── student/
│           │   ├── session/
│           │   ├── payment/
│           │   ├── subscription/
│           │   ├── promotion/
│           │   ├── progress/
│           │   ├── profile/
│           │   └── inquiry/
│           ├── middleware/
│           │   ├── auth.middleware.ts
│           │   └── error.middleware.ts
│           ├── config/
│           └── app.ts
└── packages/
    └── shared/                 <- Zod schemas + shared TS types
```

---

## 6. Backend Architecture

**Pattern:** OOP with Controller -> Service -> Repository layers

| Layer            | Responsibility                                                       |
| ---------------- | -------------------------------------------------------------------- |
| **Routes**       | Define endpoints, attach middleware                                  |
| **Controllers**  | Parse HTTP request/response, delegate to service — no business logic |
| **Services**     | All business logic and rules                                         |
| **Repositories** | All Mongoose queries — never called directly by controllers          |
| **Models**       | Mongoose schemas                                                     |

**Auth flow:**

1. Coach logs in -> Express validates credentials, issues JWT
2. JWT payload: `{ userId, role, coachId }`
3. Stored as httpOnly cookie on Next.js frontend
4. Every API request sends cookie -> Express auth.middleware validates JWT
5. Multi-tenant enforcement: all queries scoped to `coachId` from token

---

## 7. Data Model (MongoDB — 10 Collections)

### users

```
_id, email, passwordHash, role: 'coach' | 'super_admin',
name, phone, createdAt, updatedAt
```

### students

```
_id, coachId, name, email, phone, notes,
skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite',
isActive, createdAt, updatedAt
```

### sessions

```
_id, coachId, title, type: 'private' | 'group',
studentIds[], date, startTime, endTime, location,
status: 'scheduled' | 'completed' | 'cancelled',
notes, createdAt
```

### payments

```
_id, coachId, studentId, sessionId?,
amount, currency: 'PHP',
method: 'cash' | 'gcash' | 'bank_transfer' | 'other',
status: 'paid' | 'unpaid' | 'partial',
paidAt, notes, createdAt
```

### subscriptions

```
_id, coachId, tier: 'starter' | 'pro' | 'team',
status: 'trial' | 'active' | 'expired' | 'cancelled',
trialEndsAt, currentPeriodStart, currentPeriodEnd, createdAt
```

### progress_entries (Pro tier)

```
_id, coachId, studentId, sessionId?,
type: 'general' | 'assessment' | 'goal' | 'milestone',
content,              <- freeform rich text
skillTags[],          <- e.g. ['dinking', 'serve', 'footwork']
createdAt
```

### promotions

```
_id, code,            <- unique promo code (e.g. "PROMO50")
description,
discountType: 'percentage' | 'fixed',
discountValue,        <- e.g. 20 for 20% off, or 200 for P200 off
applicableTiers[],
expiresAt: Date | null,
maxRedemptions: number | null,
currentRedemptions: number,
isActive: boolean,
createdBy,            <- super admin userId
createdAt, updatedAt
```

### redemptions

```
_id, promotionId, coachId, subscriptionId,
discountApplied,      <- actual PHP amount saved
redeemedAt
```

### coach_profiles

```
_id, coachId, slug,              <- URL-friendly e.g. "ron-miong-abc1"
isPublic: boolean,               <- opt-in listing, default false
displayName, bio, photoUrl,          <- photoUrl is a Cloudinary URL
city,
specializations[],               <- e.g. ['beginner','dinking','serve','footwork']
sessionTypes[],                  <- ['private','group']
privateRate, groupRate,          <- PHP per session
ratesNote,                       <- free text e.g. "packages available"
contactEmail?, contactPhone?,    <- shown only if coach enables showContactInfo
showContactInfo: boolean,
totalViews: number,              <- atomic $inc on each profile visit
createdAt, updatedAt
```

### contact_inquiries

```
_id, coachId, coachProfileId,
visitorName, visitorEmail, visitorPhone?,
message,
status: 'new' | 'read' | 'replied',
createdAt
```

---

## 8. MVP Feature Set

### Public (no login)

- Landing/marketing page — product overview, features, pricing CTA
- Pricing page — Starter / Pro / Team in PHP
- Coach directory (/coaches) — searchable, filterable by city and specialization
- Coach profile page (/coaches/[slug]) — photo, bio, city, specializations, session types, rates, total view count, contact form + optional contact details

### Coach — Starter

- Register, login, forgot password
- Dashboard — upcoming sessions, unpaid balances, student count
- Student management — add/edit/archive students, skill level, notes
- Session management — create private or group sessions, assign students, mark complete/cancelled
- Payment tracking — record cash/GCash/bank transfer, mark paid/unpaid/partial
- Profile — edit name, phone, password
- Public profile setup — opt-in listing, bio, photo, city, specializations, rates, contact preferences
- Inquiry inbox — view and manage contact inquiries from visitors (status: new / read / replied)
- Profile view count — see total views on their public profile

### Coach — Pro (all Starter features, plus)

- Student Progress Log — create timestamped entries per student (general / assessment / goal / milestone), tag by skill area, view full chronological timeline per student
- Session notes and post-session summaries
- Payment reports — monthly revenue, outstanding balances
- Automated email reminders to students (via Resend)
- Profile analytics — views this week vs last week, trend over time

### Coach — Team (future)

- Multi-coach accounts, staff management

### Super Admin

- View all coaches — name, email, tier, trial status, joined date
- Manage subscriptions — upgrade/downgrade/cancel any coach
- Promo management — create/edit/deactivate promos (date + usage expiry, percentage + fixed discounts)
- View redemption history per promo

---

## 9. API Conventions

- Base path: /api/v1/
- Success response: { success: true, data: {...} }
- Error response: { success: false, error: { code, message } }
- HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Validation Error, 500 Server Error

---

## 10. Coding Conventions

**Git:**

- Branch naming: feature/coach-login, fix/session-overlap, chore/update-deps
- Commits: Conventional Commits — feat:, fix:, chore:, test:, docs:
- No direct pushes to main — PRs required

**TDD (red-green-refactor):**

1. Write a failing test
2. Write minimum code to pass
3. Refactor without breaking tests

**TypeScript:**

- No any — use unknown when type is truly unknown
- All Zod schemas in packages/shared — never duplicated

**Code style:**

- ESLint + Prettier enforced via Husky + lint-staged pre-commit hooks
- Repository pattern: services never call Model.find() directly

**Environment variables (required):**

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Railway + .env.local
- `JWT_SECRET`, `MONGODB_URI`, `RESEND_API_KEY` — Railway + .env.local
- `NEXT_PUBLIC_API_URL` — Vercel + .env.local

---

## 11. Payment Philosophy

No payment gateway integration in MVP. Coaches record payments manually:

- Amount, method (cash / GCash / bank transfer / other), status, date
- Rationale: formal payment gateway requires BIR registration, which most independent coaches lack

Formal payment processing is a future upgrade path once coaches are established.

---

## 12. Design System

### Design Principles

Inspired by Whoop's visual discipline — not its colors. The guiding rules:

- One accent color does all the work; everything else recedes
- Large, light-weight numbers as the primary UI element on data screens
- Generous whitespace — let things breathe
- No gradients, no decorative illustration, no stock imagery
- Dark-first, premium feel — not a generic SaaS dashboard

### Color Palette

| Token            | Hex       | Usage                                       |
| ---------------- | --------- | ------------------------------------------- |
| `bg-base`        | `#0C0C10` | Page background, sidebar                    |
| `bg-surface`     | `#16161E` | Cards, inputs, modals                       |
| `bg-border`      | `#22222E` | Card borders, dividers                      |
| `bg-muted`       | `#555566` | Disabled text, secondary labels             |
| `accent`         | `#C8F135` | Primary actions, active states, key metrics |
| `text-primary`   | `#FFFFFF` | Headings, primary content                   |
| `text-secondary` | `#CCCCCC` | Body text, descriptions                     |
| `error`          | `#FF6B6B` | Unpaid indicators, destructive actions      |

### Typography

| Role               | Font    | Weight                  | Usage                                 |
| ------------------ | ------- | ----------------------- | ------------------------------------- |
| Display / Headings | Outfit  | 600–800                 | Page titles, section headers          |
| UI / Body          | DM Sans | 300–600                 | Labels, descriptions, form fields     |
| Large Numbers      | Outfit  | 200                     | Dashboard stat figures (Whoop-style)  |
| Data Labels        | DM Sans | 600, uppercase, tracked | Metric labels (e.g. "SESSIONS TODAY") |

Loaded via `next/font/google` — zero layout shift, no external requests at runtime.

### Layout

**Coach Dashboard:** Left sidebar (fixed, 200px) + scrollable content area

- Sidebar: logo, nav items, user avatar + settings at bottom
- Content: stat cards row, then session list / activity below
- Mobile: sidebar collapses to bottom tab bar (5 items max)

**Navigation items (coach):** Dashboard, Students, Sessions, Payments, Profile

**Navigation items (super admin):** Overview, Coaches, Subscriptions, Promotions

### Component Style Rules

- Border radius: `8px` for cards, `6px` for buttons/inputs, `20px` for pills/tags
- Buttons: solid accent (`#C8F135` + `#0C0C10` text) for primary; ghost with `#22222E` border for secondary
- Inputs: `bg-surface` background, `bg-border` border, focus ring in `accent`
- Status pills: accent green for active/paid, `#FF6B6B` for unpaid/error, `#555566` for cancelled
- Icons: Lucide React (outline style, 18px default)
- Shadows: none — borders do the separation work on dark backgrounds
