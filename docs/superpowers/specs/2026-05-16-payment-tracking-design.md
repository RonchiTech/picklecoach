# Payment Tracking Design Spec

## 1. Goal

Allow coaches to record payment transactions per student (cash, GCash, bank transfer), mark them as paid/unpaid/partial, and surface the total outstanding balance on the dashboard.

## 2. Architecture

Follows the same three-layer pattern as Student and Session modules:

```
shared package  →  Zod schemas + PublicPayment type
API             →  model → repository → service → controller → routes
Web             →  server-component pages → client components (PaymentForm, PaymentList)
```

No new external dependencies. All amounts in PHP (Philippine Peso).

## 3. Data Model

MongoDB collection: `payments`

```
_id         ObjectId
coachId     ObjectId  ref: User     required, indexed
studentId   ObjectId  ref: Student  required
sessionId   ObjectId  ref: Session  optional
amount      Number                  required, min: 0  (PHP)
method      'cash' | 'gcash' | 'bank_transfer' | 'other'  default: 'cash'
status      'paid' | 'unpaid' | 'partial'                  default: 'unpaid'
notes       String    optional
paidAt      Date      optional  (set when status becomes 'paid')
createdAt   Date      auto
updatedAt   Date      auto
```

Multi-tenancy: every query scoped to `coachId`. Cross-coach access returns 404.

## 4. Shared Package

### Zod schemas (`packages/shared/src/schemas/payment.schema.ts`)

```ts
createPaymentSchema: {
  studentId: string (min 1)
  sessionId?: string
  amount: number (min 0)
  method: 'cash' | 'gcash' | 'bank_transfer' | 'other'  default 'cash'
  status: 'paid' | 'unpaid' | 'partial'                  default 'unpaid'
  notes?: string (max 500)
}

updatePaymentSchema: all fields optional except studentId omitted
```

### Types (`packages/shared/src/types/index.ts`)

```ts
export type PaymentMethod = 'cash' | 'gcash' | 'bank_transfer' | 'other'
export type PaymentStatus = 'paid' | 'unpaid' | 'partial'

export interface PublicPayment {
  _id: string
  coachId: string
  studentId: string
  sessionId?: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  notes?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}
```

## 5. API Routes (`/api/v1/payments`)

All routes require `authenticate` middleware.

| Method | Path | Description                                                              |
| ------ | ---- | ------------------------------------------------------------------------ |
| GET    | /    | List payments for coach, sorted newest first. Accepts `?page=1&limit=20` |
| POST   | /    | Create payment record                                                    |
| GET    | /:id | Get single payment                                                       |
| PATCH  | /:id | Update amount, status, method, notes                                     |
| DELETE | /:id | Delete payment record                                                    |

### Repository (`session.repository.ts` pattern)

```ts
interface IPaymentRepository {
  findAllByCoach(
    coachId: string,
    page: number,
    limit: number
  ): Promise<{ payments: IPayment[]; total: number }>
  findById(id: string, coachId: string): Promise<IPayment | null>
  create(data: CreateData): Promise<IPayment>
  update(id: string, coachId: string, data: UpdateData): Promise<IPayment | null>
  delete(id: string, coachId: string): Promise<boolean>
  sumUnpaidByCoach(coachId: string): Promise<number> // unpaid + partial
}
```

`sumUnpaidByCoach` uses MongoDB `$match` + `$group` aggregation:

- Match: `{ coachId, status: { $in: ['unpaid', 'partial'] } }`
- Group: `{ _id: null, total: { $sum: '$amount' } }`
- Returns `total` or `0` if no documents.

### Service

- `list(coachId, page, limit)` — delegates to repo; returns `{ payments, total, page, limit }`
- `getOne(coachId, id)` — 404 if not found
- `create(coachId, input)` — sets `paidAt: new Date()` when `status === 'paid'`
- `update(coachId, id, input)` — 404 if not found; sets/clears `paidAt` based on new status
- `delete(coachId, id)` — 404 if not found

## 6. Dashboard Update

`DashboardService.getStats` updated to call `paymentRepo.sumUnpaidByCoach(coachId)` and return the real `unpaidBalance`.

Since `DashboardService` currently directly uses Mongoose models (not a repository), it will call `Payment.aggregate(...)` directly, consistent with how it calls `Student.countDocuments` and `Session.countDocuments`.

## 7. Web UI

### Pages (server components)

| Route                           | File                          | Description                                        |
| ------------------------------- | ----------------------------- | -------------------------------------------------- |
| `/dashboard/payments`           | `payments/page.tsx`           | Fetches payments + students, renders `PaymentList` |
| `/dashboard/payments/new`       | `payments/new/page.tsx`       | Fetches students, renders `PaymentForm`            |
| `/dashboard/payments/[id]/edit` | `payments/[id]/edit/page.tsx` | Fetches payment + students, renders `PaymentForm`  |

### `PaymentList` (client component)

- Flat list, sorted newest first, 20 records per page
- Each row: student name, method, date, amount, status pill (paid=green, unpaid=red, partial=yellow), Edit link
- Pagination controls at the bottom: Previous / Next buttons, current page indicator
- Page is driven by a `?page=N` query param — server component reads it and passes to `serverApiFetch`
- "No payments yet" empty state with link to `/dashboard/payments/new`

### `PaymentForm` (client component)

Fields:

- Student — `<select>` populated from students prop (required)
- Amount (₱) — `<input type="number" min="0" step="0.01">` (required)
- Method — `<select>` cash / GCash / Bank transfer / Other (default: cash)
- Status — `<select>` unpaid / partial / paid (default: unpaid)
- Notes — `<textarea>` optional

On submit: `POST /api/v1/payments` (create) or `PATCH /api/v1/payments/:id` (edit), redirect to `/dashboard/payments`.

## 8. Testing

Three-layer TDD (red → green → commit):

- `payment.repository.test.ts` — real MongoDB (`picklecoach_test`): create, findAllByCoach with pagination (returns correct page + total), findById scoped to coachId, sumUnpaidByCoach aggregation
- `payment.service.test.ts` — mocked `IPaymentRepository`: paidAt auto-set on paid status, 404 on not found
- `payment.integration.test.ts` — Supertest: 401 without token, CRUD flow, cross-coach 404, aggregation result
- `dashboard.service.test.ts` — updated to mock `Payment.aggregate`

## 9. Out of Scope (Starter MVP)

- Payment reports / monthly revenue summaries (Pro tier)
- Automated reminders (Pro tier)
- Filtering/sorting in the UI (can be added later)
