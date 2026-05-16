# Public Coach Directory Design

## Goal

Build a public-facing coach directory at `/coaches` and individual coach profile pages at `/coaches/[slug]`, backed by a new unauthenticated API module, so prospective students can discover and contact coaches without an account.

---

## Architecture

### Backend: New `public-coaches` module

Location: `apps/api/src/modules/public-coaches/`

A separate module from the authenticated `coach-profile` module. It reads from the same `coach_profiles` MongoDB collection but exposes read-only, public-facing endpoints with no `authenticate` middleware.

**Endpoints:**

| Method | Path                    | Description                                    |
| ------ | ----------------------- | ---------------------------------------------- |
| GET    | `/api/v1/coaches`       | Paginated, filtered listing of public profiles |
| GET    | `/api/v1/coaches/:slug` | Single profile by slug + increment totalViews  |

**Rate limiting:** `express-rate-limit` applied to the entire `/api/v1/coaches` router. Limit: 60 requests per 15 minutes per IP. Rationale: prevents scripted inflation of `totalViews` and protects the DB from unauthenticated abuse.

### Frontend: New `(public)` route group

Location: `apps/web/src/app/(public)/`

No sidebar, no auth required. Two pages:

- `coaches/page.tsx` — listing with filters + pagination
- `coaches/[slug]/page.tsx` — individual profile

A new `public-api.ts` utility (no auth token) handles server-side fetches to `/api/v1/coaches`.

---

## Data Flow

### Listing page

1. Request arrives at `/coaches?specialization=dinking&city=manila&page=2`
2. Next.js server component reads search params, calls `GET /api/v1/coaches` with those params
3. `PublicCoachesController` passes validated query to `PublicCoachesService`
4. Service calls `repo.findAll({ filters, page, limit: 12 })`
5. Repository builds MongoDB filter: always `{ isPublic: true }`, plus optional `specializations`, `city` (case-insensitive regex), `sessionTypes`
6. Returns `{ coaches, total, page, totalPages }`
7. Page renders coach cards + pagination controls

### Profile page

1. Request arrives at `/coaches/coach-ron-a1b2`
2. Server component calls `GET /api/v1/coaches/coach-ron-a1b2`
3. Service calls `repo.findBySlug(slug)` — checks `isPublic: true`
4. If found: service calls `repo.incrementViews(slug)` atomically (`$inc: { totalViews: 1 }`)
5. Returns full `PublicCoachProfile` to the page
6. If not found or not public: 404

---

## Filtering & Pagination

Query params (all optional, combinable):

- `specialization` — matches one value in the `specializations` array
- `city` — case-insensitive regex match
- `sessionType` — matches one value in the `sessionTypes` array
- `page` — defaults to 1

Pagination: `skip((page - 1) * 12).limit(12)`, default sort `{ totalViews: -1 }`.

Response shape:

```json
{
  "coaches": [...],
  "total": 84,
  "page": 2,
  "totalPages": 7
}
```

---

## Frontend Layout

### `/coaches` — Listing Page

- Filter bar: 2 dropdowns (Specialization, Session Type) + 1 text input (City), state in URL search params (shareable/bookmarkable). City is free-text because coaches enter arbitrary values — a dropdown would require a separate distinct-values endpoint.
- 12-card grid — each card: photo, display name, city, up to 3 specialization pills, session types, "View Profile" link
- Pagination controls (prev/next + page number) at bottom
- Empty state when zero results

### `/coaches/[slug]` — Profile Page

- Hero: photo, display name, city, specialization pills
- Bio (if present)
- Session types and rates (rates section hidden if not set by coach)
- Contact section — only rendered when `showContactInfo: true`; shows email/phone as plain text (no messaging, no forms)
- "Back to directory" link

Both pages are server components. Data fetched at render time via `public-api.ts`.

---

## Rate Limiting

Package: `express-rate-limit`

Config:

```typescript
import rateLimit from 'express-rate-limit'

export const publicCoachesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})
```

Applied at the router level, before all route handlers in `public-coaches.routes.ts`.

---

## Error Handling

| Code              | Status | When                                    |
| ----------------- | ------ | --------------------------------------- |
| `COACH_NOT_FOUND` | 404    | Slug not found or profile is not public |

All other errors fall through to the global error middleware.

---

## Testing Strategy

Three-layer TDD, run with `--runInBand`:

### Repository tests (real MongoDB `picklecoach_test`)

- `findAll` returns only `isPublic: true` profiles
- Each filter (specialization, city, sessionType) narrows results correctly
- Filters combine correctly
- Pagination returns the correct slice and accurate `total`
- City match is case-insensitive
- `findBySlug` returns null for non-public profiles
- `incrementViews` atomically increments `totalViews` by 1

### Service tests (mocked repo)

- All filter params are passed through to repo unchanged
- `incrementViews` is called after a successful `findBySlug`
- Throws `COACH_NOT_FOUND` (404) when repo returns null

### Integration tests (Supertest + real DB)

- `GET /api/v1/coaches` returns paginated results with correct shape
- Filter query params work end-to-end
- `GET /api/v1/coaches/:slug` increments `totalViews` by 1 on each call
- `GET /api/v1/coaches/:slug` returns 404 for unknown slug
- `GET /api/v1/coaches/:slug` returns 404 for a profile with `isPublic: false`

**Note:** Rate limiter is not tested in integration tests to avoid flaky failures from hitting the limit mid-suite.

---

## Shared Types

`PublicCoachProfile` already added to `packages/shared/src/types/index.ts` in Plan 8.

New query type to add:

```typescript
export interface CoachDirectoryQuery {
  specialization?: string
  city?: string
  sessionType?: string
  page?: number
}

export interface CoachDirectoryResult {
  coaches: PublicCoachProfile[]
  total: number
  page: number
  totalPages: number
}
```

---

## Files to Create / Modify

**Create:**

- `apps/api/src/modules/public-coaches/public-coaches.model.ts` — re-exports `CoachProfile` model (read from same collection)
- `apps/api/src/modules/public-coaches/public-coaches.repository.ts`
- `apps/api/src/modules/public-coaches/public-coaches.repository.test.ts`
- `apps/api/src/modules/public-coaches/public-coaches.service.ts`
- `apps/api/src/modules/public-coaches/public-coaches.service.test.ts`
- `apps/api/src/modules/public-coaches/public-coaches.controller.ts`
- `apps/api/src/modules/public-coaches/public-coaches.routes.ts`
- `apps/api/src/modules/public-coaches/public-coaches.integration.test.ts`
- `apps/web/src/lib/public-api.ts`
- `apps/web/src/app/(public)/coaches/page.tsx`
- `apps/web/src/app/(public)/coaches/[slug]/page.tsx`
- `apps/web/src/components/coaches/CoachCard.tsx`
- `apps/web/src/components/coaches/CoachFilters.tsx`
- `apps/web/src/components/coaches/CoachPagination.tsx`

**Modify:**

- `apps/api/src/app.ts` — mount `/api/v1/coaches` router
- `packages/shared/src/types/index.ts` — add `CoachDirectoryQuery` and `CoachDirectoryResult`
