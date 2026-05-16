# Payment Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full payment tracking module — shared schemas/types, API (model → repository → service → controller → routes), dashboard unpaidBalance wired to real data, and web UI (form, paginated list, three pages).

**Architecture:** Three-layer pattern identical to Session module. Payments always belong to a student (`studentId` required) and optionally a session (`sessionId` optional). The list endpoint is paginated (`?page=1&limit=20`). The dashboard aggregates unpaid+partial amounts via MongoDB `$aggregate`.

**Tech Stack:** TypeScript, Zod, Mongoose, Express, Next.js 15 App Router, Tailwind CSS v4, Jest, Supertest.

---

> **IMPORTANT — file creation:** The Write tool may be blocked by a security hook in this project. Use `cat << 'EOF' > path` bash heredocs for ALL new file creation. Use `python3 << 'PYEOF'` with string replacement for edits when the Edit tool is blocked. Never use the Write tool.

---

### Task 1: Payment schemas + types in shared package

**Files:**

- Create: `packages/shared/src/schemas/payment.schema.ts`
- Modify: `packages/shared/src/types/index.ts` (add `PublicPayment`)
- Modify: `packages/shared/src/index.ts` (export payment schema)

- [ ] **Step 1: Write the failing type check**

Run the TypeScript compiler to confirm `PublicPayment` and `createPaymentSchema` do not exist yet:

```bash
cd packages/shared && node_modules/.bin/tsc --noEmit 2>&1 | head -5
# Expected: clean (no errors yet — confirms baseline)
```

- [ ] **Step 2: Create the payment schema file**

```bash
cat << 'EOF' > "packages/shared/src/schemas/payment.schema.ts"
import { z } from 'zod'

export const createPaymentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  sessionId: z.string().optional(),
  amount: z.number().min(0, 'Amount must be non-negative'),
  method: z.enum(['cash', 'gcash', 'bank_transfer', 'other']).default('cash'),
  status: z.enum(['paid', 'unpaid', 'partial']).default('unpaid'),
  notes: z.string().max(500).optional(),
})

export const updatePaymentSchema = z.object({
  amount: z.number().min(0).optional(),
  method: z.enum(['cash', 'gcash', 'bank_transfer', 'other']).optional(),
  status: z.enum(['paid', 'unpaid', 'partial']).optional(),
  notes: z.string().max(500).optional(),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
EOF
```

- [ ] **Step 3: Add PublicPayment to types/index.ts**

Append after the `PublicSession` interface:

```bash
python3 << 'PYEOF'
path = "packages/shared/src/types/index.ts"
content = open(path).read()
addition = """
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
"""
open(path, 'w').write(content + addition)
print("done")
PYEOF
```

- [ ] **Step 4: Export the payment schema from shared index**

```bash
python3 << 'PYEOF'
path = "packages/shared/src/index.ts"
content = open(path).read()
new_content = content + "export * from './schemas/payment.schema'\n"
open(path, 'w').write(new_content)
print("done")
PYEOF
```

- [ ] **Step 5: Verify the shared package compiles**

```bash
cd packages/shared && node_modules/.bin/tsc --noEmit 2>&1
# Expected: no output (clean)
```

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/schemas/payment.schema.ts \
        packages/shared/src/types/index.ts \
        packages/shared/src/index.ts
git commit -m "feat: add payment schemas and PublicPayment type to shared package"
```

---

### Task 2: Payment Mongoose model

**Files:**

- Create: `apps/api/src/modules/payment/payment.model.ts`

- [ ] **Step 1: Create the model file**

```bash
cat << 'EOF' > "apps/api/src/modules/payment/payment.model.ts"
import mongoose, { Document, Schema } from 'mongoose'
import type { PaymentMethod, PaymentStatus } from '@picklecoach/shared'

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId
  coachId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  sessionId?: mongoose.Types.ObjectId
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  notes?: string
  paidAt?: Date
}

const paymentSchema = new Schema<IPayment>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session' },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['cash', 'gcash', 'bank_transfer', 'other'], default: 'cash' },
    status: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'unpaid' },
    notes: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
)

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema)
EOF
```

- [ ] **Step 2: Verify the API compiles**

```bash
cd apps/api && node_modules/.bin/tsc --noEmit 2>&1
# Expected: no output (clean)
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/payment/payment.model.ts
git commit -m "feat: add Payment mongoose model"
```

---

### Task 3: Payment repository (TDD)

**Files:**

- Create: `apps/api/src/modules/payment/payment.repository.test.ts`
- Create: `apps/api/src/modules/payment/payment.repository.ts`

- [ ] **Step 1: Write the failing repository tests**

```bash
cat << 'EOF' > "apps/api/src/modules/payment/payment.repository.test.ts"
import mongoose from 'mongoose'
import { Payment } from './payment.model'
import { PaymentRepository } from './payment.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new PaymentRepository()

const COACH_A = new mongoose.Types.ObjectId().toString()
const COACH_B = new mongoose.Types.ObjectId().toString()
const STUDENT_ID = new mongoose.Types.ObjectId()

const seed = (overrides: Record<string, unknown> = {}) =>
  Payment.create({
    coachId: COACH_A,
    studentId: STUDENT_ID,
    amount: 1000,
    method: 'cash',
    status: 'unpaid',
    ...overrides,
  })

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await Payment.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await Payment.deleteMany({})
})

describe('PaymentRepository.findAllByCoach', () => {
  it('returns empty array and zero total when coach has no payments', async () => {
    const result = await repo.findAllByCoach(COACH_A, 1, 20)
    expect(result.payments).toEqual([])
    expect(result.total).toBe(0)
  })

  it('returns only payments belonging to the given coach', async () => {
    await seed()
    await seed({ coachId: COACH_B })
    const result = await repo.findAllByCoach(COACH_A, 1, 20)
    expect(result.payments).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('paginates correctly', async () => {
    await seed({ amount: 100 })
    await seed({ amount: 200 })
    await seed({ amount: 300 })

    const page1 = await repo.findAllByCoach(COACH_A, 1, 2)
    expect(page1.payments).toHaveLength(2)
    expect(page1.total).toBe(3)

    const page2 = await repo.findAllByCoach(COACH_A, 2, 2)
    expect(page2.payments).toHaveLength(1)
    expect(page2.total).toBe(3)
  })

  it('returns payments sorted by createdAt descending', async () => {
    await seed({ amount: 100 })
    await seed({ amount: 200 })
    const result = await repo.findAllByCoach(COACH_A, 1, 20)
    expect(result.payments[0].amount).toBe(200)
    expect(result.payments[1].amount).toBe(100)
  })
})

describe('PaymentRepository.findById', () => {
  it('returns null for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    expect(await repo.findById(fakeId, COACH_A)).toBeNull()
  })

  it('returns null when payment belongs to a different coach', async () => {
    const payment = await seed()
    expect(await repo.findById(payment._id.toString(), COACH_B)).toBeNull()
  })

  it('returns the payment when id and coachId match', async () => {
    const payment = await seed({ amount: 500 })
    const found = await repo.findById(payment._id.toString(), COACH_A)
    expect(found?.amount).toBe(500)
  })
})

describe('PaymentRepository.create', () => {
  it('creates a payment with the correct fields and default status', async () => {
    const payment = await repo.create({
      coachId: COACH_A,
      studentId: STUDENT_ID.toString(),
      amount: 750,
      method: 'gcash',
      status: 'unpaid',
    })
    expect(payment.coachId.toString()).toBe(COACH_A)
    expect(payment.amount).toBe(750)
    expect(payment.method).toBe('gcash')
    expect(payment.status).toBe('unpaid')
  })
})

describe('PaymentRepository.update', () => {
  it('returns null when payment not found or wrong coach', async () => {
    const payment = await seed()
    expect(await repo.update(payment._id.toString(), COACH_B, { status: 'paid' })).toBeNull()
  })

  it('updates and returns the updated payment', async () => {
    const payment = await seed()
    const updated = await repo.update(payment._id.toString(), COACH_A, {
      status: 'paid',
      amount: 1500,
    })
    expect(updated?.status).toBe('paid')
    expect(updated?.amount).toBe(1500)
  })
})

describe('PaymentRepository.delete', () => {
  it('returns false when payment not found or wrong coach', async () => {
    const payment = await seed()
    expect(await repo.delete(payment._id.toString(), COACH_B)).toBe(false)
  })

  it('deletes and returns true when found', async () => {
    const payment = await seed()
    const result = await repo.delete(payment._id.toString(), COACH_A)
    expect(result).toBe(true)
    expect(await Payment.findById(payment._id)).toBeNull()
  })
})

describe('PaymentRepository.sumUnpaidByCoach', () => {
  it('returns 0 when coach has no payments', async () => {
    expect(await repo.sumUnpaidByCoach(COACH_A)).toBe(0)
  })

  it('sums only unpaid and partial amounts, not paid', async () => {
    await seed({ amount: 1000, status: 'unpaid' })
    await seed({ amount: 500, status: 'partial' })
    await seed({ amount: 800, status: 'paid' })
    await seed({ coachId: COACH_B, amount: 999, status: 'unpaid' })

    expect(await repo.sumUnpaidByCoach(COACH_A)).toBe(1500)
  })
})
EOF
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/api && node_modules/.bin/jest payment.repository.test --no-coverage --runInBand 2>&1 | tail -10
# Expected: FAIL — "Cannot find module './payment.repository'"
```

- [ ] **Step 3: Write the repository implementation**

```bash
cat << 'EOF' > "apps/api/src/modules/payment/payment.repository.ts"
import mongoose from 'mongoose'
import { IPayment, Payment } from './payment.model'
import type { PaymentMethod, PaymentStatus } from '@picklecoach/shared'

type CreateData = {
  coachId: string
  studentId: string
  sessionId?: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  notes?: string
  paidAt?: Date
}

export type PaymentUpdateData = {
  amount?: number
  method?: PaymentMethod
  status?: PaymentStatus
  notes?: string
  paidAt?: Date | null
}

export interface IPaymentRepository {
  findAllByCoach(
    coachId: string,
    page: number,
    limit: number,
  ): Promise<{ payments: IPayment[]; total: number }>
  findById(id: string, coachId: string): Promise<IPayment | null>
  create(data: CreateData): Promise<IPayment>
  update(id: string, coachId: string, data: PaymentUpdateData): Promise<IPayment | null>
  delete(id: string, coachId: string): Promise<boolean>
  sumUnpaidByCoach(coachId: string): Promise<number>
}

export class PaymentRepository implements IPaymentRepository {
  async findAllByCoach(
    coachId: string,
    page: number,
    limit: number,
  ): Promise<{ payments: IPayment[]; total: number }> {
    const skip = (page - 1) * limit
    const [payments, total] = await Promise.all([
      Payment.find({ coachId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments({ coachId }),
    ])
    return { payments, total }
  }

  async findById(id: string, coachId: string): Promise<IPayment | null> {
    return Payment.findOne({ _id: id, coachId })
  }

  async create(data: CreateData): Promise<IPayment> {
    return Payment.create(data)
  }

  async update(id: string, coachId: string, data: PaymentUpdateData): Promise<IPayment | null> {
    const { paidAt, ...rest } = data
    const ops: Record<string, unknown> = { $set: rest }
    if (paidAt === null) ops.$unset = { paidAt: '' }
    else if (paidAt !== undefined) (ops.$set as Record<string, unknown>).paidAt = paidAt
    return Payment.findOneAndUpdate({ _id: id, coachId }, ops, { new: true })
  }

  async delete(id: string, coachId: string): Promise<boolean> {
    const result = await Payment.deleteOne({ _id: id, coachId })
    return result.deletedCount === 1
  }

  async sumUnpaidByCoach(coachId: string): Promise<number> {
    const result = await Payment.aggregate([
      {
        $match: {
          coachId: new mongoose.Types.ObjectId(coachId),
          status: { $in: ['unpaid', 'partial'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])
    return result[0]?.total ?? 0
  }
}
EOF
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd apps/api && node_modules/.bin/jest payment.repository.test --no-coverage --runInBand 2>&1 | tail -15
# Expected: PASS — all tests green
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/payment/payment.repository.test.ts \
        apps/api/src/modules/payment/payment.repository.ts
git commit -m "feat: add PaymentRepository with pagination and unpaid sum (TDD)"
```

---

### Task 4: Payment service (TDD)

**Files:**

- Create: `apps/api/src/modules/payment/payment.service.test.ts`
- Create: `apps/api/src/modules/payment/payment.service.ts`

- [ ] **Step 1: Write the failing service tests**

```bash
cat << 'EOF' > "apps/api/src/modules/payment/payment.service.test.ts"
import { PaymentService } from './payment.service'
import type { IPaymentRepository } from './payment.repository'
import type { IPayment } from './payment.model'
import mongoose from 'mongoose'

const COACH_ID = 'coach-123'
const PAYMENT_ID = new mongoose.Types.ObjectId().toString()
const STUDENT_ID = new mongoose.Types.ObjectId().toString()

const mockPayment = {
  _id: { toString: () => PAYMENT_ID },
  coachId: { toString: () => COACH_ID },
  studentId: { toString: () => STUDENT_ID },
  amount: 1000,
  method: 'cash',
  status: 'unpaid',
} as unknown as IPayment

const mockRepo: jest.Mocked<IPaymentRepository> = {
  findAllByCoach: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  sumUnpaidByCoach: jest.fn(),
}

let service: PaymentService

beforeEach(() => {
  jest.clearAllMocks()
  service = new PaymentService(mockRepo)
})

describe('PaymentService.list', () => {
  it('returns paginated result with page and limit', async () => {
    mockRepo.findAllByCoach.mockResolvedValue({ payments: [mockPayment], total: 1 })
    const result = await service.list(COACH_ID, 1, 20)
    expect(result.payments).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(mockRepo.findAllByCoach).toHaveBeenCalledWith(COACH_ID, 1, 20)
  })
})

describe('PaymentService.getOne', () => {
  it('throws PAYMENT_NOT_FOUND when payment does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null)
    await expect(service.getOne(COACH_ID, PAYMENT_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'PAYMENT_NOT_FOUND',
    })
  })

  it('returns the payment when found', async () => {
    mockRepo.findById.mockResolvedValue(mockPayment)
    const result = await service.getOne(COACH_ID, PAYMENT_ID)
    expect(result.amount).toBe(1000)
  })
})

describe('PaymentService.create', () => {
  it('sets paidAt when status is paid', async () => {
    mockRepo.create.mockResolvedValue(mockPayment)
    await service.create(COACH_ID, {
      studentId: STUDENT_ID,
      amount: 1000,
      method: 'cash',
      status: 'paid',
    })
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ paidAt: expect.any(Date) })
    )
  })

  it('does not set paidAt when status is unpaid', async () => {
    mockRepo.create.mockResolvedValue(mockPayment)
    await service.create(COACH_ID, {
      studentId: STUDENT_ID,
      amount: 1000,
      method: 'cash',
      status: 'unpaid',
    })
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ paidAt: undefined })
    )
  })
})

describe('PaymentService.update', () => {
  it('throws PAYMENT_NOT_FOUND when payment does not exist', async () => {
    mockRepo.update.mockResolvedValue(null)
    await expect(service.update(COACH_ID, PAYMENT_ID, { status: 'paid' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'PAYMENT_NOT_FOUND',
    })
  })

  it('sets paidAt when updating status to paid', async () => {
    const paid = { ...mockPayment, status: 'paid' } as unknown as IPayment
    mockRepo.update.mockResolvedValue(paid)
    await service.update(COACH_ID, PAYMENT_ID, { status: 'paid' })
    expect(mockRepo.update).toHaveBeenCalledWith(
      PAYMENT_ID,
      COACH_ID,
      expect.objectContaining({ paidAt: expect.any(Date) })
    )
  })

  it('clears paidAt when updating status to unpaid', async () => {
    mockRepo.update.mockResolvedValue(mockPayment)
    await service.update(COACH_ID, PAYMENT_ID, { status: 'unpaid' })
    expect(mockRepo.update).toHaveBeenCalledWith(
      PAYMENT_ID,
      COACH_ID,
      expect.objectContaining({ paidAt: null })
    )
  })

  it('returns the updated payment', async () => {
    const updated = { ...mockPayment, amount: 500 } as unknown as IPayment
    mockRepo.update.mockResolvedValue(updated)
    const result = await service.update(COACH_ID, PAYMENT_ID, { amount: 500 })
    expect(result.amount).toBe(500)
  })
})

describe('PaymentService.delete', () => {
  it('throws PAYMENT_NOT_FOUND when payment does not exist', async () => {
    mockRepo.delete.mockResolvedValue(false)
    await expect(service.delete(COACH_ID, PAYMENT_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'PAYMENT_NOT_FOUND',
    })
  })

  it('resolves without error when payment is deleted', async () => {
    mockRepo.delete.mockResolvedValue(true)
    await expect(service.delete(COACH_ID, PAYMENT_ID)).resolves.toBeUndefined()
  })
})
EOF
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/api && node_modules/.bin/jest payment.service.test --no-coverage 2>&1 | tail -10
# Expected: FAIL — "Cannot find module './payment.service'"
```

- [ ] **Step 3: Write the service implementation**

```bash
cat << 'EOF' > "apps/api/src/modules/payment/payment.service.ts"
import type { CreatePaymentInput, UpdatePaymentInput } from '@picklecoach/shared'
import type { IPaymentRepository, PaymentUpdateData } from './payment.repository'
import type { IPayment } from './payment.model'
import { createError } from '../../middleware/error.middleware'

type PaymentListResult = {
  payments: IPayment[]
  total: number
  page: number
  limit: number
}

export class PaymentService {
  constructor(private repo: IPaymentRepository) {}

  async list(coachId: string, page: number, limit: number): Promise<PaymentListResult> {
    const { payments, total } = await this.repo.findAllByCoach(coachId, page, limit)
    return { payments, total, page, limit }
  }

  async getOne(coachId: string, id: string): Promise<IPayment> {
    const payment = await this.repo.findById(id, coachId)
    if (!payment) throw createError('Payment not found', 404, 'PAYMENT_NOT_FOUND')
    return payment
  }

  async create(coachId: string, input: CreatePaymentInput): Promise<IPayment> {
    const paidAt = input.status === 'paid' ? new Date() : undefined
    return this.repo.create({ coachId, ...input, paidAt })
  }

  async update(coachId: string, id: string, input: UpdatePaymentInput): Promise<IPayment> {
    const data: PaymentUpdateData = { ...input }
    if (input.status === 'paid') data.paidAt = new Date()
    else if (input.status !== undefined) data.paidAt = null
    const payment = await this.repo.update(id, coachId, data)
    if (!payment) throw createError('Payment not found', 404, 'PAYMENT_NOT_FOUND')
    return payment
  }

  async delete(coachId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(id, coachId)
    if (!deleted) throw createError('Payment not found', 404, 'PAYMENT_NOT_FOUND')
  }
}
EOF
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd apps/api && node_modules/.bin/jest payment.service.test --no-coverage 2>&1 | tail -15
# Expected: PASS — all tests green
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/payment/payment.service.test.ts \
        apps/api/src/modules/payment/payment.service.ts
git commit -m "feat: add PaymentService with paidAt lifecycle and pagination (TDD)"
```

---

### Task 5: Payment controller, routes, and mount

**Files:**

- Create: `apps/api/src/modules/payment/payment.controller.ts`
- Create: `apps/api/src/modules/payment/payment.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create the controller**

```bash
cat << 'EOF' > "apps/api/src/modules/payment/payment.controller.ts"
import type { Request, Response, NextFunction } from 'express'
import { createPaymentSchema, updatePaymentSchema } from '@picklecoach/shared'
import { PaymentService } from './payment.service'

export class PaymentController {
  constructor(private service: PaymentService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1)
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
      const result = await this.service.list(req.user!.userId, page, limit)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await this.service.getOne(req.user!.userId, req.params.id)
      res.json({ success: true, data: payment })
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createPaymentSchema.parse(req.body)
      const payment = await this.service.create(req.user!.userId, input)
      res.status(201).json({ success: true, data: payment })
    } catch (err) {
      next(err)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updatePaymentSchema.parse(req.body)
      const payment = await this.service.update(req.user!.userId, req.params.id, input)
      res.json({ success: true, data: payment })
    } catch (err) {
      next(err)
    }
  }

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.user!.userId, req.params.id)
      res.json({ success: true, data: null })
    } catch (err) {
      next(err)
    }
  }
}
EOF
```

- [ ] **Step 2: Create the routes file**

```bash
cat << 'EOF' > "apps/api/src/modules/payment/payment.routes.ts"
import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import { PaymentRepository } from './payment.repository'
import { PaymentService } from './payment.service'
import { PaymentController } from './payment.controller'

const router = Router()
const repo = new PaymentRepository()
const service = new PaymentService(repo)
const controller = new PaymentController(service)

router.use(authenticate)
router.get('/', controller.list)
router.post('/', controller.create)
router.get('/:id', controller.getOne)
router.patch('/:id', controller.update)
router.delete('/:id', controller.delete)

export { router as paymentRoutes }
EOF
```

- [ ] **Step 3: Mount payment routes in app.ts**

```bash
python3 << 'PYEOF'
path = "apps/api/src/app.ts"
content = open(path).read()
content = content.replace(
    "import { sessionRoutes } from './modules/session/session.routes'",
    "import { sessionRoutes } from './modules/session/session.routes'\nimport { paymentRoutes } from './modules/payment/payment.routes'"
)
content = content.replace(
    "app.use('/api/v1/sessions', sessionRoutes)",
    "app.use('/api/v1/sessions', sessionRoutes)\n  app.use('/api/v1/payments', paymentRoutes)"
)
open(path, 'w').write(content)
print("done")
PYEOF
```

- [ ] **Step 4: Verify API compiles**

```bash
cd apps/api && node_modules/.bin/tsc --noEmit 2>&1
# Expected: no output (clean)
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/payment/payment.controller.ts \
        apps/api/src/modules/payment/payment.routes.ts \
        apps/api/src/app.ts
git commit -m "feat: add payment controller, routes, mount at /api/v1/payments"
```

---

### Task 6: Payment integration tests

**Files:**

- Create: `apps/api/src/modules/payment/payment.integration.test.ts`

- [ ] **Step 1: Write the integration tests**

```bash
cat << 'EOF' > "apps/api/src/modules/payment/payment.integration.test.ts"
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'
import { Student } from '../student/student.model'
import { Payment } from './payment.model'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
  await Payment.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
  await Payment.deleteMany({})
})

async function loginAndGetCookie(): Promise<{ cookie: string[]; studentId: string }> {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Coach Ron', email: 'ron@test.com', password: 'password123' })
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'ron@test.com', password: 'password123' })
  const cookie = login.headers['set-cookie'] as unknown as string[]

  const studentRes = await request(app)
    .post('/api/v1/students')
    .set('Cookie', cookie)
    .send({ name: 'Jane Smith', skillLevel: 'beginner' })

  return { cookie, studentId: studentRes.body.data._id }
}

describe('GET /api/v1/payments', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/payments')
    expect(res.status).toBe(401)
  })

  it('returns paginated result when coach has no payments', async () => {
    const { cookie } = await loginAndGetCookie()
    const res = await request(app).get('/api/v1/payments').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.data.payments).toEqual([])
    expect(res.body.data.total).toBe(0)
    expect(res.body.data.page).toBe(1)
    expect(res.body.data.limit).toBe(20)
  })

  it('respects ?page and ?limit query params', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/v1/payments')
        .set('Cookie', cookie)
        .send({ studentId, amount: (i + 1) * 100, method: 'cash', status: 'unpaid' })
    }
    const res = await request(app)
      .get('/api/v1/payments?page=1&limit=2')
      .set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.data.payments).toHaveLength(2)
    expect(res.body.data.total).toBe(3)
    expect(res.body.data.page).toBe(1)
    expect(res.body.data.limit).toBe(2)
  })
})

describe('POST /api/v1/payments', () => {
  it('creates a payment and returns 201', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 1000, method: 'gcash', status: 'unpaid' })

    expect(res.status).toBe(201)
    expect(res.body.data.amount).toBe(1000)
    expect(res.body.data.method).toBe('gcash')
    expect(res.body.data.status).toBe('unpaid')
    expect(res.body.data.studentId).toBe(studentId)
  })

  it('sets paidAt when status is paid', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 500, method: 'cash', status: 'paid' })

    expect(res.status).toBe(201)
    expect(res.body.data.paidAt).toBeTruthy()
  })

  it('returns 400 VALIDATION_ERROR for missing studentId', async () => {
    const { cookie } = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ amount: 1000, method: 'cash' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 VALIDATION_ERROR for negative amount', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: -100, method: 'cash' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/v1/payments/:id', () => {
  it('returns 404 PAYMENT_NOT_FOUND for unknown id', async () => {
    const { cookie } = await loginAndGetCookie()
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app).get(`/api/v1/payments/${fakeId}`).set('Cookie', cookie)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('PAYMENT_NOT_FOUND')
  })

  it('returns the payment when found', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const create = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 750, method: 'bank_transfer', status: 'partial' })

    const res = await request(app)
      .get(`/api/v1/payments/${create.body.data._id}`)
      .set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.data.amount).toBe(750)
  })
})

describe('PATCH /api/v1/payments/:id', () => {
  it('updates payment status and returns 200', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const create = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 1000, method: 'cash', status: 'unpaid' })

    const res = await request(app)
      .patch(`/api/v1/payments/${create.body.data._id}`)
      .set('Cookie', cookie)
      .send({ status: 'paid' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('paid')
    expect(res.body.data.paidAt).toBeTruthy()
  })

  it('returns 404 for a payment belonging to another coach', async () => {
    const { cookie: cookieA, studentId } = await loginAndGetCookie()
    const create = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookieA)
      .send({ studentId, amount: 1000, method: 'cash', status: 'unpaid' })

    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach B', email: 'b@test.com', password: 'password123' })
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'b@test.com', password: 'password123' })
    const cookieB = loginB.headers['set-cookie'] as unknown as string[]

    const res = await request(app)
      .patch(`/api/v1/payments/${create.body.data._id}`)
      .set('Cookie', cookieB)
      .send({ status: 'paid' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/v1/payments/:id', () => {
  it('deletes the payment and returns success', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const create = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie)
      .send({ studentId, amount: 500, method: 'cash', status: 'unpaid' })

    const res = await request(app)
      .delete(`/api/v1/payments/${create.body.data._id}`)
      .set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('returns 404 for a payment belonging to another coach', async () => {
    const { cookie: cookieA, studentId } = await loginAndGetCookie()
    const create = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookieA)
      .send({ studentId, amount: 500, method: 'cash', status: 'unpaid' })

    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach B', email: 'b@test.com', password: 'password123' })
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'b@test.com', password: 'password123' })
    const cookieB = loginB.headers['set-cookie'] as unknown as string[]

    const res = await request(app)
      .delete(`/api/v1/payments/${create.body.data._id}`)
      .set('Cookie', cookieB)
    expect(res.status).toBe(404)
  })
})
EOF
```

- [ ] **Step 2: Run the integration tests**

```bash
cd apps/api && node_modules/.bin/jest payment.integration.test --no-coverage --runInBand 2>&1 | tail -20
# Expected: PASS — all tests green
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/payment/payment.integration.test.ts
git commit -m "test: add payment module integration tests"
```

---

### Task 7: Wire dashboard unpaidBalance to real sum

**Files:**

- Modify: `apps/api/src/modules/dashboard/dashboard.service.ts`
- Modify: `apps/api/src/modules/dashboard/dashboard.service.test.ts`

- [ ] **Step 1: Update dashboard.service.ts**

```bash
python3 << 'PYEOF'
path = "apps/api/src/modules/dashboard/dashboard.service.ts"
content = open(path).read()
new_content = """import type { DashboardStats } from '@picklecoach/shared'
import mongoose from 'mongoose'
import { Student } from '../student/student.model'
import { Session } from '../session/session.model'
import { Payment } from '../payment/payment.model'

export class DashboardService {
  async getStats(coachId: string): Promise<DashboardStats> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [totalStudents, todaySessions, unpaidResult] = await Promise.all([
      Student.countDocuments({ coachId, isActive: true }),
      Session.countDocuments({
        coachId,
        scheduledAt: { $gte: todayStart, $lte: todayEnd },
        status: { $ne: 'cancelled' },
      }),
      Payment.aggregate([
        {
          $match: {
            coachId: new mongoose.Types.ObjectId(coachId),
            status: { $in: ['unpaid', 'partial'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ])

    const unpaidBalance = unpaidResult[0]?.total ?? 0
    return { todaySessions, totalStudents, unpaidBalance }
  }
}
"""
open(path, 'w').write(new_content)
print("done")
PYEOF
```

- [ ] **Step 2: Update dashboard.service.test.ts**

```bash
cat << 'EOF' > "apps/api/src/modules/dashboard/dashboard.service.test.ts"
import { DashboardService } from './dashboard.service'

jest.mock('../student/student.model', () => ({
  Student: { countDocuments: jest.fn() },
}))

jest.mock('../session/session.model', () => ({
  Session: { countDocuments: jest.fn() },
}))

jest.mock('../payment/payment.model', () => ({
  Payment: { aggregate: jest.fn() },
}))

import { Student } from '../student/student.model'
import { Session } from '../session/session.model'
import { Payment } from '../payment/payment.model'

let service: DashboardService

beforeEach(() => {
  jest.clearAllMocks()
  service = new DashboardService()
  ;(Student.countDocuments as jest.Mock).mockResolvedValue(0)
  ;(Session.countDocuments as jest.Mock).mockResolvedValue(0)
  ;(Payment.aggregate as jest.Mock).mockResolvedValue([])
})

describe('DashboardService.getStats', () => {
  it('returns zero stats when no data exists', async () => {
    const stats = await service.getStats('any-coach-id')
    expect(stats).toEqual({ todaySessions: 0, totalStudents: 0, unpaidBalance: 0 })
  })

  it('returns real student count from Student model', async () => {
    ;(Student.countDocuments as jest.Mock).mockResolvedValue(5)
    const stats = await service.getStats('coach-abc')
    expect(stats.totalStudents).toBe(5)
    expect(Student.countDocuments).toHaveBeenCalledWith({ coachId: 'coach-abc', isActive: true })
  })

  it('returns real session count from Session model', async () => {
    ;(Session.countDocuments as jest.Mock).mockResolvedValue(3)
    const stats = await service.getStats('coach-abc')
    expect(stats.todaySessions).toBe(3)
  })

  it('returns real unpaid balance from Payment aggregate', async () => {
    ;(Payment.aggregate as jest.Mock).mockResolvedValue([{ _id: null, total: 2500 }])
    const stats = await service.getStats('coach-abc')
    expect(stats.unpaidBalance).toBe(2500)
  })

  it('returns 0 unpaid balance when aggregate returns empty array', async () => {
    ;(Payment.aggregate as jest.Mock).mockResolvedValue([])
    const stats = await service.getStats('coach-abc')
    expect(stats.unpaidBalance).toBe(0)
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

- [ ] **Step 3: Run the dashboard tests**

```bash
cd apps/api && node_modules/.bin/jest dashboard.service.test --no-coverage 2>&1 | tail -15
# Expected: PASS — all tests green
```

- [ ] **Step 4: Run the full test suite**

```bash
cd apps/api && node_modules/.bin/jest --no-coverage --runInBand 2>&1 | tail -15
# Expected: all test suites pass
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/dashboard/dashboard.service.ts \
        apps/api/src/modules/dashboard/dashboard.service.test.ts
git commit -m "feat: wire dashboard unpaidBalance to real Payment aggregate"
```

---

### Task 8: PaymentForm component

**Files:**

- Create: `apps/web/src/components/payments/PaymentForm.tsx`

- [ ] **Step 1: Create the PaymentForm component**

```bash
mkdir -p "apps/web/src/components/payments"
cat << 'EOF' > "apps/web/src/components/payments/PaymentForm.tsx"
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublicPayment, PublicStudent } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

type PaymentFormProps = {
  students: PublicStudent[]
  payment?: PublicPayment
}

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'
const LABEL_CLS = 'block text-sm font-medium text-text-secondary'

export function PaymentForm({ students, payment }: PaymentFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isEdit = !!payment

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
        .value

    const body = {
      studentId: getValue('studentId'),
      amount: Number(getValue('amount')),
      method: getValue('method'),
      status: getValue('status'),
      notes: getValue('notes') || undefined,
    }

    try {
      const path = isEdit ? `/api/v1/payments/${payment._id}` : '/api/v1/payments'
      const method = isEdit ? 'PATCH' : 'POST'
      await apiFetch(path, { method, body })
      router.push('/dashboard/payments')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5">
      {!isEdit && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="studentId" className={LABEL_CLS}>
            Student <span className="text-error">*</span>
          </label>
          <select id="studentId" name="studentId" required className={INPUT_CLS}>
            <option value="">Select student…</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className={LABEL_CLS}>
          Amount (₱) <span className="text-error">*</span>
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={payment?.amount}
          placeholder="0"
          className={INPUT_CLS}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="method" className={LABEL_CLS}>
            Method
          </label>
          <select
            id="method"
            name="method"
            defaultValue={payment?.method ?? 'cash'}
            className={INPUT_CLS}
          >
            <option value="cash">Cash</option>
            <option value="gcash">GCash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="status" className={LABEL_CLS}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={payment?.status ?? 'unpaid'}
            className={INPUT_CLS}
          >
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className={LABEL_CLS}>
          Notes <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={payment?.notes}
          placeholder="e.g. 3 sessions this week"
          className={INPUT_CLS}
        />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add payment'}
        </button>
        <a
          href="/dashboard/payments"
          className="rounded-lg border border-border px-6 py-2.5 text-sm text-text-secondary transition-colors hover:border-text-secondary hover:text-text-primary"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
EOF
```

- [ ] **Step 2: Verify TypeScript is clean**

```bash
cd apps/web && node_modules/.bin/tsc --noEmit 2>&1
# Expected: no output (clean)
```

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/components/payments/PaymentForm.tsx"
git commit -m "feat: add PaymentForm client component"
```

---

### Task 9: PaymentList component with pagination

**Files:**

- Create: `apps/web/src/components/payments/PaymentList.tsx`

- [ ] **Step 1: Create the PaymentList component**

```bash
cat << 'EOF' > "apps/web/src/components/payments/PaymentList.tsx"
'use client'

import type { PublicPayment, PublicStudent } from '@picklecoach/shared'

type PaymentListProps = {
  payments: PublicPayment[]
  studentMap: Record<string, PublicStudent>
  total: number
  page: number
  limit: number
}

const STATUS_PILL: Record<string, string> = {
  paid: 'bg-success/15 text-success',
  unpaid: 'bg-error/15 text-error',
  partial: 'bg-yellow-500/15 text-yellow-400',
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  bank_transfer: 'Bank transfer',
  other: 'Other',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatAmount(amount: number) {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`
}

export function PaymentList({ payments, studentMap, total, page, limit }: PaymentListProps) {
  const totalPages = Math.ceil(total / limit)

  if (payments.length === 0 && page === 1) {
    return (
      <p className="text-sm text-muted">
        No payments yet.{' '}
        <a href="/dashboard/payments/new" className="text-accent hover:underline">
          Add one
        </a>
        .
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {payments.map((p) => {
          const student = studentMap[p.studentId]
          const pill = STATUS_PILL[p.status] ?? 'bg-muted/20 text-muted'

          return (
            <li
              key={p._id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex flex-col gap-1">
                <p className="font-medium text-text-primary">{student?.name ?? 'Unknown'}</p>
                <p className="text-sm text-text-secondary">
                  {METHOD_LABEL[p.method]} · {formatDate(p.createdAt)}
                </p>
                {p.notes && <p className="mt-0.5 text-xs text-muted">{p.notes}</p>}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="font-semibold text-text-primary">{formatAmount(p.amount)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${pill}`}>
                  {p.status}
                </span>
                <a
                  href={`/dashboard/payments/${p._id}/edit`}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-text-secondary hover:text-text-primary"
                >
                  Edit
                </a>
              </div>
            </li>
          )
        })}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <a
            href={page > 1 ? `?page=${page - 1}` : '#'}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-border px-4 py-2 text-sm transition-colors ${
              page <= 1
                ? 'pointer-events-none opacity-40'
                : 'text-text-secondary hover:border-text-secondary hover:text-text-primary'
            }`}
          >
            Previous
          </a>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <a
            href={page < totalPages ? `?page=${page + 1}` : '#'}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-border px-4 py-2 text-sm transition-colors ${
              page >= totalPages
                ? 'pointer-events-none opacity-40'
                : 'text-text-secondary hover:border-text-secondary hover:text-text-primary'
            }`}
          >
            Next
          </a>
        </div>
      )}
    </div>
  )
}
EOF
```

- [ ] **Step 2: Verify TypeScript is clean**

```bash
cd apps/web && node_modules/.bin/tsc --noEmit 2>&1
# Expected: no output (clean)
```

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/components/payments/PaymentList.tsx"
git commit -m "feat: add PaymentList client component with pagination"
```

---

### Task 10: Payments pages (list, new, edit)

**Files:**

- Create: `apps/web/src/app/(dashboard)/dashboard/payments/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/payments/new/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/payments/[id]/edit/page.tsx`

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p "apps/web/src/app/(dashboard)/dashboard/payments/new"
mkdir -p "apps/web/src/app/(dashboard)/dashboard/payments/[id]/edit"
```

- [ ] **Step 2: Create the payments list page**

```bash
cat << 'EOF' > "apps/web/src/app/(dashboard)/dashboard/payments/page.tsx"
import type { PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { PaymentList } from '@/components/payments/PaymentList'
import type { PublicPayment } from '@picklecoach/shared'

type PageProps = { searchParams: Promise<{ page?: string }> }

type PaymentListData = {
  payments: PublicPayment[]
  total: number
  page: number
  limit: number
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const [result, students] = await Promise.all([
    serverApiFetch<PaymentListData>(`/api/v1/payments?page=${page}&limit=20`),
    serverApiFetch<PublicStudent[]>('/api/v1/students'),
  ])

  const studentMap = Object.fromEntries((students ?? []).map((s) => [s._id, s]))

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-text-primary">Payments</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {result?.total ?? 0} record{result?.total !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="/dashboard/payments/new"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-base transition-opacity hover:opacity-90"
        >
          + Add payment
        </a>
      </div>

      <div className="mt-6">
        <PaymentList
          payments={result?.payments ?? []}
          studentMap={studentMap}
          total={result?.total ?? 0}
          page={result?.page ?? 1}
          limit={result?.limit ?? 20}
        />
      </div>
    </div>
  )
}
EOF
```

- [ ] **Step 3: Create the new payment page**

```bash
cat << 'EOF' > "apps/web/src/app/(dashboard)/dashboard/payments/new/page.tsx"
import type { PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { PaymentForm } from '@/components/payments/PaymentForm'

export default async function NewPaymentPage() {
  const students = await serverApiFetch<PublicStudent[]>('/api/v1/students')

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Add payment</h1>
      <p className="mt-1 text-sm text-text-secondary">Record a payment from a student</p>
      <div className="mt-6">
        <PaymentForm students={students ?? []} />
      </div>
    </div>
  )
}
EOF
```

- [ ] **Step 4: Create the edit payment page**

```bash
cat << 'EOF' > "apps/web/src/app/(dashboard)/dashboard/payments/[id]/edit/page.tsx"
import { notFound } from 'next/navigation'
import type { PublicPayment, PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { PaymentForm } from '@/components/payments/PaymentForm'

type Props = { params: Promise<{ id: string }> }

export default async function EditPaymentPage({ params }: Props) {
  const { id } = await params
  const [payment, students] = await Promise.all([
    serverApiFetch<PublicPayment>(`/api/v1/payments/${id}`),
    serverApiFetch<PublicStudent[]>('/api/v1/students'),
  ])

  if (!payment) notFound()

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Edit payment</h1>
      <p className="mt-1 text-sm text-text-secondary">Update payment details or status</p>
      <div className="mt-6">
        <PaymentForm students={students ?? []} payment={payment} />
      </div>
    </div>
  )
}
EOF
```

- [ ] **Step 5: Verify TypeScript is clean**

```bash
cd apps/web && node_modules/.bin/tsc --noEmit 2>&1
# Expected: no output (clean)
```

- [ ] **Step 6: Run the full API test suite one final time**

```bash
cd apps/api && node_modules/.bin/jest --no-coverage --runInBand 2>&1 | tail -10
# Expected: all test suites pass
```

- [ ] **Step 7: Commit**

```bash
git add "apps/web/src/app/(dashboard)/dashboard/payments/page.tsx" \
        "apps/web/src/app/(dashboard)/dashboard/payments/new/page.tsx" \
        "apps/web/src/app/(dashboard)/dashboard/payments/[id]/edit/page.tsx"
git commit -m "feat: add payments pages (list with pagination, new, edit)"
```

---

### Task 11: Browser verification

**Goal:** Confirm the full flow works end-to-end in the browser.

- [ ] **Step 1: Ensure servers are running**

```bash
# API on port 4000
curl -s http://localhost:4000/health
# Expected: {"success":true,"data":{"status":"ok"}}

# Web on port 3000
curl -s http://localhost:3000/dashboard/payments | grep -o 'Payments' | head -1
# Expected: Payments
```

If servers are not running, start them:

```bash
pnpm --filter api dev &
pnpm --filter web dev &
```

- [ ] **Step 2: Open payments list in browser**

Navigate to `http://localhost:3000/dashboard/payments`. Verify:

- "Payments" heading renders
- "0 records" subtitle
- "+ Add payment" button
- "No payments yet. Add one." empty state with lime link

- [ ] **Step 3: Add a payment**

Click "+ Add payment". On the form:

- Select a student from the dropdown
- Enter amount: 1000
- Method: GCash
- Status: Unpaid
- Notes: "3 sessions this week"
- Click "Add payment"

Verify:

- Redirects to `/dashboard/payments`
- Row shows student name, "GCash", amount ₱1,000, red "Unpaid" pill, Edit link

- [ ] **Step 4: Mark as paid**

Click "Edit" on the payment. Change status to "Paid". Click "Save changes". Verify:

- Redirects to list
- Status pill is now green "Paid"

- [ ] **Step 5: Verify dashboard unpaidBalance**

Navigate to `http://localhost:3000/dashboard`. Verify:

- "Unpaid Balance" card shows ₱0 (since the payment was just marked paid)

Add another payment with status "Unpaid" (amount 500). Return to dashboard. Verify:

- "Unpaid Balance" card shows ₱500

- [ ] **Step 6: Test pagination**

Add enough payments (>20) or use `?page=2` in the URL to verify pagination controls render (Previous / Next, "Page N of M").

- [ ] **Step 7: Done — invoke finishing-a-development-branch skill**
