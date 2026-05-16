# Session Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full session CRUD — schedule, list, edit, mark complete, and cancel sessions — with coach-scoped API, a sessions dashboard page, and the "Sessions Today" stat card wired to real data.

**Architecture:** Follows the same Controller → Service → Repository pattern as the student module. Sessions are always scoped to `coachId`. The `scheduledAt` date is stored as a MongoDB `Date`; Zod schemas accept ISO 8601 strings on the API boundary and the service converts them to `Date` before passing to the repository. The web layer passes both sessions and students to `SessionList` so student names can be displayed without a second API call.

**Tech Stack:** Express.js, Mongoose, Zod, Jest + Supertest (API); Next.js 15 App Router, Tailwind CSS v4 (web)

---

## File Map

**Shared**

- Create: `packages/shared/src/schemas/session.schema.ts` — Zod create/update schemas + inferred types
- Modify: `packages/shared/src/types/index.ts` — add `PublicSession` interface
- Modify: `packages/shared/src/index.ts` — export session schema

**API — new module**

- Create: `apps/api/src/modules/session/session.model.ts`
- Create: `apps/api/src/modules/session/session.repository.ts`
- Create: `apps/api/src/modules/session/session.repository.test.ts`
- Create: `apps/api/src/modules/session/session.service.ts`
- Create: `apps/api/src/modules/session/session.service.test.ts`
- Create: `apps/api/src/modules/session/session.controller.ts`
- Create: `apps/api/src/modules/session/session.routes.ts`
- Create: `apps/api/src/modules/session/session.integration.test.ts`
- Modify: `apps/api/src/modules/dashboard/dashboard.service.ts` — count today's sessions
- Modify: `apps/api/src/modules/dashboard/dashboard.service.test.ts` — mock Session model
- Modify: `apps/api/src/app.ts` — mount `/api/v1/sessions`

**Web — new files**

- Create: `apps/web/src/components/sessions/SessionForm.tsx` — schedule/edit form (client)
- Create: `apps/web/src/components/sessions/SessionList.tsx` — table with complete/cancel (client)
- Create: `apps/web/src/app/(dashboard)/dashboard/sessions/page.tsx` — list page (server)
- Create: `apps/web/src/app/(dashboard)/dashboard/sessions/new/page.tsx` — schedule page (server)
- Create: `apps/web/src/app/(dashboard)/dashboard/sessions/[id]/edit/page.tsx` — edit page (server)

---

### Task 1: Session schemas + types in shared package

**Files:**

- Create: `packages/shared/src/schemas/session.schema.ts`
- Modify: `packages/shared/src/types/index.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create session Zod schemas**

```bash
cat << 'EOF' > packages/shared/src/schemas/session.schema.ts
import { z } from 'zod'

export const createSessionSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, 'At least one student is required'),
  type: z.enum(['private', 'group']).default('private'),
  scheduledAt: z.string().datetime('Must be a valid ISO datetime'),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  notes: z.string().max(1000).optional(),
})

export const updateSessionSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1).optional(),
  type: z.enum(['private', 'group']).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  notes: z.string().max(1000).optional(),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>
EOF
```

- [ ] **Step 2: Add PublicSession interface to shared types**

Open `packages/shared/src/types/index.ts` and append at the bottom:

```typescript
export interface PublicSession {
  _id: string
  coachId: string
  studentIds: string[]
  type: SessionType
  status: SessionStatus
  scheduledAt: string
  durationMinutes: number
  notes?: string
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 3: Export session schema from shared index**

Replace `packages/shared/src/index.ts` with:

```typescript
export * from './types/index'
export * from './schemas/auth.schema'
export * from './schemas/student.schema'
export * from './schemas/session.schema'
```

- [ ] **Step 4: Rebuild shared package**

```bash
pnpm --filter shared build
```

Expected: No errors. `dist/` regenerated.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/
git commit -m "feat: add session Zod schemas and PublicSession type to shared package"
```

---

### Task 2: Session Mongoose model

**Files:**

- Create: `apps/api/src/modules/session/session.model.ts`

- [ ] **Step 1: Create the session model**

```bash
mkdir -p apps/api/src/modules/session

cat << 'EOF' > apps/api/src/modules/session/session.model.ts
import mongoose, { Document, Schema } from 'mongoose'
import type { SessionType, SessionStatus } from '@picklecoach/shared'

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId
  coachId: mongoose.Types.ObjectId
  studentIds: mongoose.Types.ObjectId[]
  type: SessionType
  status: SessionStatus
  scheduledAt: Date
  durationMinutes: number
  notes?: string
}

const sessionSchema = new Schema<ISession>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    type: { type: String, enum: ['private', 'group'], default: 'private' },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    notes: { type: String },
  },
  { timestamps: true }
)

export const Session = mongoose.model<ISession>('Session', sessionSchema)
EOF
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/session/session.model.ts
git commit -m "feat: add Session Mongoose model"
```

---

### Task 3: Session repository (TDD — real DB)

**Files:**

- Create: `apps/api/src/modules/session/session.repository.test.ts`
- Create: `apps/api/src/modules/session/session.repository.ts`

The repository is always scoped to `coachId`. All queries filter by both `_id` and `coachId`.

- [ ] **Step 1: Write the failing repository tests**

```bash
cat << 'EOF' > apps/api/src/modules/session/session.repository.test.ts
import mongoose from 'mongoose'
import { Session } from './session.model'
import { SessionRepository } from './session.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new SessionRepository()

const COACH_A = new mongoose.Types.ObjectId().toString()
const COACH_B = new mongoose.Types.ObjectId().toString()
const STUDENT_ID = new mongoose.Types.ObjectId()

const seed = (overrides: Record<string, unknown> = {}) =>
  Session.create({
    coachId: COACH_A,
    studentIds: [STUDENT_ID],
    type: 'private',
    status: 'scheduled',
    scheduledAt: new Date(),
    durationMinutes: 60,
    ...overrides,
  })

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await Session.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await Session.deleteMany({})
})

describe('SessionRepository.findAllByCoach', () => {
  it('returns empty array when coach has no sessions', async () => {
    const result = await repo.findAllByCoach(COACH_A)
    expect(result).toEqual([])
  })

  it('returns only sessions belonging to the given coach', async () => {
    await seed()
    await seed({ coachId: COACH_B })

    const result = await repo.findAllByCoach(COACH_A)
    expect(result).toHaveLength(1)
  })

  it('returns sessions sorted by scheduledAt descending', async () => {
    const earlier = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    const later = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    await seed({ scheduledAt: earlier })
    await seed({ scheduledAt: later })

    const result = await repo.findAllByCoach(COACH_A)
    expect(result[0].scheduledAt.getTime()).toBeGreaterThan(result[1].scheduledAt.getTime())
  })
})

describe('SessionRepository.findById', () => {
  it('returns null for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    expect(await repo.findById(fakeId, COACH_A)).toBeNull()
  })

  it('returns null when session belongs to a different coach', async () => {
    const session = await seed()
    expect(await repo.findById(session._id.toString(), COACH_B)).toBeNull()
  })

  it('returns the session when id and coachId match', async () => {
    const session = await seed({ type: 'group' })
    const found = await repo.findById(session._id.toString(), COACH_A)
    expect(found?.type).toBe('group')
  })
})

describe('SessionRepository.create', () => {
  it('creates and returns a session with coachId and default status', async () => {
    const session = await repo.create({
      coachId: COACH_A,
      studentIds: [STUDENT_ID.toString()],
      type: 'private',
      scheduledAt: new Date(),
      durationMinutes: 45,
    })
    expect(session.coachId.toString()).toBe(COACH_A)
    expect(session.status).toBe('scheduled')
    expect(session.durationMinutes).toBe(45)
  })
})

describe('SessionRepository.update', () => {
  it('returns null when session not found or wrong coach', async () => {
    const session = await seed()
    expect(await repo.update(session._id.toString(), COACH_B, { status: 'completed' })).toBeNull()
  })

  it('updates and returns the updated session', async () => {
    const session = await seed()
    const updated = await repo.update(session._id.toString(), COACH_A, {
      status: 'completed',
      notes: 'Great session',
    })
    expect(updated?.status).toBe('completed')
    expect(updated?.notes).toBe('Great session')
  })
})

describe('SessionRepository.countTodayByCoach', () => {
  it('returns 0 when coach has no sessions today', async () => {
    expect(await repo.countTodayByCoach(COACH_A)).toBe(0)
  })

  it('counts scheduled and completed sessions today but not cancelled', async () => {
    await seed({ status: 'scheduled' })
    await seed({ status: 'completed' })
    await seed({ status: 'cancelled' })
    await seed({ coachId: COACH_B })

    expect(await repo.countTodayByCoach(COACH_A)).toBe(2)
  })

  it('does not count sessions from other days', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    await seed({ scheduledAt: yesterday })

    expect(await repo.countTodayByCoach(COACH_A)).toBe(0)
  })
})
EOF
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && node_modules/.bin/jest session.repository.test --no-coverage --runInBand 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module './session.repository'`

- [ ] **Step 3: Write the repository**

```bash
cat << 'EOF' > apps/api/src/modules/session/session.repository.ts
import { ISession, Session } from './session.model'
import type { SessionType, SessionStatus } from '@picklecoach/shared'

type CreateData = {
  coachId: string
  studentIds: string[]
  type: SessionType
  scheduledAt: Date
  durationMinutes: number
  notes?: string
}

export type SessionUpdateData = {
  studentIds?: string[]
  type?: SessionType
  status?: SessionStatus
  scheduledAt?: Date
  durationMinutes?: number
  notes?: string
}

export interface ISessionRepository {
  findAllByCoach(coachId: string): Promise<ISession[]>
  findById(id: string, coachId: string): Promise<ISession | null>
  create(data: CreateData): Promise<ISession>
  update(id: string, coachId: string, data: SessionUpdateData): Promise<ISession | null>
  countTodayByCoach(coachId: string): Promise<number>
}

export class SessionRepository implements ISessionRepository {
  async findAllByCoach(coachId: string): Promise<ISession[]> {
    return Session.find({ coachId }).sort({ scheduledAt: -1 })
  }

  async findById(id: string, coachId: string): Promise<ISession | null> {
    return Session.findOne({ _id: id, coachId })
  }

  async create(data: CreateData): Promise<ISession> {
    return Session.create(data)
  }

  async update(id: string, coachId: string, data: SessionUpdateData): Promise<ISession | null> {
    return Session.findOneAndUpdate({ _id: id, coachId }, { $set: data }, { new: true })
  }

  async countTodayByCoach(coachId: string): Promise<number> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    return Session.countDocuments({
      coachId,
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: 'cancelled' },
    })
  }
}
EOF
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd apps/api && node_modules/.bin/jest session.repository.test --no-coverage --runInBand 2>&1 | tail -20
```

Expected: PASS — all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/session/
git commit -m "feat: add SessionRepository with CRUD and countTodayByCoach (TDD)"
```

---

### Task 4: Session service (TDD — mocked repo)

**Files:**

- Create: `apps/api/src/modules/session/session.service.test.ts`
- Create: `apps/api/src/modules/session/session.service.ts`

- [ ] **Step 1: Write the failing service tests**

```bash
cat << 'EOF' > apps/api/src/modules/session/session.service.test.ts
import { SessionService } from './session.service'
import type { ISessionRepository } from './session.repository'
import type { ISession } from './session.model'
import mongoose from 'mongoose'

const COACH_ID = 'coach-123'
const SESSION_ID = new mongoose.Types.ObjectId().toString()

const mockSession = {
  _id: { toString: () => SESSION_ID },
  coachId: { toString: () => COACH_ID },
  studentIds: [],
  type: 'private',
  status: 'scheduled',
  scheduledAt: new Date(),
  durationMinutes: 60,
} as unknown as ISession

const mockRepo: jest.Mocked<ISessionRepository> = {
  findAllByCoach: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  countTodayByCoach: jest.fn(),
}

let service: SessionService

beforeEach(() => {
  jest.clearAllMocks()
  service = new SessionService(mockRepo)
})

describe('SessionService.list', () => {
  it('returns sessions for the given coach', async () => {
    mockRepo.findAllByCoach.mockResolvedValue([mockSession])
    const result = await service.list(COACH_ID)
    expect(result).toHaveLength(1)
    expect(mockRepo.findAllByCoach).toHaveBeenCalledWith(COACH_ID)
  })
})

describe('SessionService.getOne', () => {
  it('throws SESSION_NOT_FOUND when session does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null)
    await expect(service.getOne(COACH_ID, SESSION_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'SESSION_NOT_FOUND',
    })
  })

  it('returns the session when found', async () => {
    mockRepo.findById.mockResolvedValue(mockSession)
    const result = await service.getOne(COACH_ID, SESSION_ID)
    expect(result.type).toBe('private')
  })
})

describe('SessionService.create', () => {
  it('converts scheduledAt string to Date and calls repo.create', async () => {
    mockRepo.create.mockResolvedValue(mockSession)
    const isoString = new Date().toISOString()
    await service.create(COACH_ID, {
      studentIds: ['student-1'],
      type: 'private',
      scheduledAt: isoString,
      durationMinutes: 60,
    })
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        coachId: COACH_ID,
        scheduledAt: expect.any(Date),
      })
    )
  })
})

describe('SessionService.update', () => {
  it('throws SESSION_NOT_FOUND when session does not exist or wrong coach', async () => {
    mockRepo.update.mockResolvedValue(null)
    await expect(service.update(COACH_ID, SESSION_ID, { status: 'completed' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'SESSION_NOT_FOUND',
    })
  })

  it('converts scheduledAt string to Date when provided', async () => {
    const updatedSession = { ...mockSession, status: 'completed' } as unknown as ISession
    mockRepo.update.mockResolvedValue(updatedSession)
    const isoString = new Date().toISOString()
    await service.update(COACH_ID, SESSION_ID, { scheduledAt: isoString })
    expect(mockRepo.update).toHaveBeenCalledWith(
      SESSION_ID,
      COACH_ID,
      expect.objectContaining({ scheduledAt: expect.any(Date) })
    )
  })

  it('returns the updated session', async () => {
    const updated = { ...mockSession, status: 'completed' } as unknown as ISession
    mockRepo.update.mockResolvedValue(updated)
    const result = await service.update(COACH_ID, SESSION_ID, { status: 'completed' })
    expect(result.status).toBe('completed')
  })
})
EOF
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && node_modules/.bin/jest session.service.test --no-coverage 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module './session.service'`

- [ ] **Step 3: Write the service**

```bash
cat << 'EOF' > apps/api/src/modules/session/session.service.ts
import type { CreateSessionInput, UpdateSessionInput } from '@picklecoach/shared'
import type { ISessionRepository, SessionUpdateData } from './session.repository'
import type { ISession } from './session.model'
import { createError } from '../../middleware/error.middleware'

export class SessionService {
  constructor(private repo: ISessionRepository) {}

  async list(coachId: string): Promise<ISession[]> {
    return this.repo.findAllByCoach(coachId)
  }

  async getOne(coachId: string, id: string): Promise<ISession> {
    const session = await this.repo.findById(id, coachId)
    if (!session) throw createError('Session not found', 404, 'SESSION_NOT_FOUND')
    return session
  }

  async create(coachId: string, input: CreateSessionInput): Promise<ISession> {
    return this.repo.create({
      coachId,
      studentIds: input.studentIds,
      type: input.type ?? 'private',
      scheduledAt: new Date(input.scheduledAt),
      durationMinutes: input.durationMinutes ?? 60,
      notes: input.notes,
    })
  }

  async update(coachId: string, id: string, input: UpdateSessionInput): Promise<ISession> {
    const { scheduledAt: rawDate, ...rest } = input
    const data: SessionUpdateData = {
      ...rest,
      ...(rawDate !== undefined ? { scheduledAt: new Date(rawDate) } : {}),
    }
    const session = await this.repo.update(id, coachId, data)
    if (!session) throw createError('Session not found', 404, 'SESSION_NOT_FOUND')
    return session
  }
}
EOF
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd apps/api && node_modules/.bin/jest session.service.test --no-coverage 2>&1 | tail -15
```

Expected: PASS — all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/session/
git commit -m "feat: add SessionService with list, getOne, create, update (TDD)"
```

---

### Task 5: Session controller + routes

**Files:**

- Create: `apps/api/src/modules/session/session.controller.ts`
- Create: `apps/api/src/modules/session/session.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create the controller**

```bash
cat << 'EOF' > apps/api/src/modules/session/session.controller.ts
import type { Request, Response, NextFunction } from 'express'
import { createSessionSchema, updateSessionSchema } from '@picklecoach/shared'
import { SessionService } from './session.service'

export class SessionController {
  constructor(private service: SessionService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessions = await this.service.list(req.user!.userId)
      res.json({ success: true, data: sessions })
    } catch (err) {
      next(err)
    }
  }

  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.service.getOne(req.user!.userId, req.params.id)
      res.json({ success: true, data: session })
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createSessionSchema.parse(req.body)
      const session = await this.service.create(req.user!.userId, input)
      res.status(201).json({ success: true, data: session })
    } catch (err) {
      next(err)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateSessionSchema.parse(req.body)
      const session = await this.service.update(req.user!.userId, req.params.id, input)
      res.json({ success: true, data: session })
    } catch (err) {
      next(err)
    }
  }
}
EOF
```

- [ ] **Step 2: Create the routes**

```bash
cat << 'EOF' > apps/api/src/modules/session/session.routes.ts
import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import { SessionRepository } from './session.repository'
import { SessionService } from './session.service'
import { SessionController } from './session.controller'

const router = Router()
const repo = new SessionRepository()
const service = new SessionService(repo)
const controller = new SessionController(service)

router.use(authenticate)
router.get('/', controller.list)
router.post('/', controller.create)
router.get('/:id', controller.getOne)
router.patch('/:id', controller.update)

export { router as sessionRoutes }
EOF
```

- [ ] **Step 3: Mount session routes in app.ts**

Open `apps/api/src/app.ts`. Add the import and mount:

```typescript
import { sessionRoutes } from './modules/session/session.routes'
// after the existing studentRoutes line:
app.use('/api/v1/sessions', sessionRoutes)
```

The full updated `apps/api/src/app.ts`:

```typescript
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorMiddleware } from './middleware/error.middleware'
import { notFoundMiddleware } from './middleware/notFound.middleware'
import { authRoutes } from './modules/auth/auth.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { studentRoutes } from './modules/student/student.routes'
import { sessionRoutes } from './modules/session/session.routes'
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
  app.use('/api/v1/students', studentRoutes)
  app.use('/api/v1/sessions', sessionRoutes)

  app.use(notFoundMiddleware)
  app.use(errorMiddleware)

  return app
}
```

Use heredoc to write the file:

```bash
cat << 'EOF' > apps/api/src/app.ts
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorMiddleware } from './middleware/error.middleware'
import { notFoundMiddleware } from './middleware/notFound.middleware'
import { authRoutes } from './modules/auth/auth.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { studentRoutes } from './modules/student/student.routes'
import { sessionRoutes } from './modules/session/session.routes'
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
  app.use('/api/v1/students', studentRoutes)
  app.use('/api/v1/sessions', sessionRoutes)

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
git add apps/api/src/modules/session/ apps/api/src/app.ts
git commit -m "feat: add session controller, routes, mount at /api/v1/sessions"
```

---

### Task 6: Session integration tests

**Files:**

- Create: `apps/api/src/modules/session/session.integration.test.ts`

- [ ] **Step 1: Write the integration tests**

```bash
cat << 'EOF' > apps/api/src/modules/session/session.integration.test.ts
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'
import { Student } from '../student/student.model'
import { Session } from './session.model'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
  await Session.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
  await Session.deleteMany({})
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

describe('GET /api/v1/sessions', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/sessions')
    expect(res.status).toBe(401)
  })

  it('returns empty array when coach has no sessions', async () => {
    const { cookie } = await loginAndGetCookie()
    const res = await request(app).get('/api/v1/sessions').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('POST /api/v1/sessions', () => {
  it('creates a session and returns 201', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookie)
      .send({
        studentIds: [studentId],
        type: 'private',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 60,
      })

    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('private')
    expect(res.body.data.status).toBe('scheduled')
    expect(res.body.data.durationMinutes).toBe(60)
    expect(res.body.data.studentIds).toContain(studentId)
  })

  it('returns 400 VALIDATION_ERROR when studentIds is empty', async () => {
    const { cookie } = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookie)
      .send({
        studentIds: [],
        type: 'private',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 60,
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 VALIDATION_ERROR for invalid scheduledAt', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookie)
      .send({
        studentIds: [studentId],
        type: 'private',
        scheduledAt: 'not-a-date',
        durationMinutes: 60,
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('appears in the session list after creation', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookie)
      .send({
        studentIds: [studentId],
        type: 'group',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 90,
      })

    const res = await request(app).get('/api/v1/sessions').set('Cookie', cookie)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].type).toBe('group')
  })
})

describe('GET /api/v1/sessions/:id', () => {
  it('returns 404 SESSION_NOT_FOUND for unknown id', async () => {
    const { cookie } = await loginAndGetCookie()
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app).get(`/api/v1/sessions/${fakeId}`).set('Cookie', cookie)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('SESSION_NOT_FOUND')
  })

  it('returns the session when found', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookie)
      .send({
        studentIds: [studentId],
        type: 'private',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 60,
      })

    const res = await request(app)
      .get(`/api/v1/sessions/${created.body.data._id}`)
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.data._id).toBe(created.body.data._id)
  })
})

describe('PATCH /api/v1/sessions/:id', () => {
  it('marks a session as completed', async () => {
    const { cookie, studentId } = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookie)
      .send({
        studentIds: [studentId],
        type: 'private',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 60,
      })

    const res = await request(app)
      .patch(`/api/v1/sessions/${created.body.data._id}`)
      .set('Cookie', cookie)
      .send({ status: 'completed', notes: 'Great session' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('completed')
    expect(res.body.data.notes).toBe('Great session')
  })

  it('returns 404 for a session belonging to another coach', async () => {
    const { cookie: cookieA, studentId } = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/sessions')
      .set('Cookie', cookieA)
      .send({
        studentIds: [studentId],
        type: 'private',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 60,
      })

    await User.deleteMany({})
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach B', email: 'b@test.com', password: 'password123' })
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'b@test.com', password: 'password123' })
    const cookieB = loginB.headers['set-cookie'] as unknown as string[]

    const res = await request(app)
      .patch(`/api/v1/sessions/${created.body.data._id}`)
      .set('Cookie', cookieB)
      .send({ status: 'completed' })

    expect(res.status).toBe(404)
  })
})
EOF
```

- [ ] **Step 2: Run the integration tests**

```bash
cd apps/api && node_modules/.bin/jest session.integration.test --no-coverage --runInBand 2>&1 | tail -20
```

Expected: PASS — all tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/session/session.integration.test.ts
git commit -m "test: add session module integration tests"
```

---

### Task 7: Wire dashboard todaySessions stat to real count

**Files:**

- Modify: `apps/api/src/modules/dashboard/dashboard.service.ts`
- Modify: `apps/api/src/modules/dashboard/dashboard.service.test.ts`

- [ ] **Step 1: Update dashboard service**

```bash
cat << 'EOF' > apps/api/src/modules/dashboard/dashboard.service.ts
import type { DashboardStats } from '@picklecoach/shared'
import { Student } from '../student/student.model'
import { Session } from '../session/session.model'

export class DashboardService {
  async getStats(coachId: string): Promise<DashboardStats> {
    const totalStudents = await Student.countDocuments({ coachId, isActive: true })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todaySessions = await Session.countDocuments({
      coachId,
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: 'cancelled' },
    })

    return { todaySessions, totalStudents, unpaidBalance: 0 }
  }
}
EOF
```

- [ ] **Step 2: Update dashboard service test**

```bash
cat << 'EOF' > apps/api/src/modules/dashboard/dashboard.service.test.ts
import { DashboardService } from './dashboard.service'

jest.mock('../student/student.model', () => ({
  Student: { countDocuments: jest.fn() },
}))
jest.mock('../session/session.model', () => ({
  Session: { countDocuments: jest.fn() },
}))

import { Student } from '../student/student.model'
import { Session } from '../session/session.model'

let service: DashboardService

beforeEach(() => {
  jest.clearAllMocks()
  service = new DashboardService()
  ;(Student.countDocuments as jest.Mock).mockResolvedValue(0)
  ;(Session.countDocuments as jest.Mock).mockResolvedValue(0)
})

describe('DashboardService.getStats', () => {
  it('returns zero stats when nothing exists', async () => {
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
    expect(Session.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        coachId: 'coach-abc',
        status: { $ne: 'cancelled' },
      })
    )
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

- [ ] **Step 3: Run dashboard service tests**

```bash
cd apps/api && node_modules/.bin/jest dashboard.service.test --no-coverage 2>&1 | tail -15
```

Expected: PASS — 4 tests pass.

- [ ] **Step 4: Run all API tests — verify no regressions**

```bash
cd apps/api && node_modules/.bin/jest --no-coverage --runInBand 2>&1 | tail -15
```

Expected: All test suites pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/dashboard/
git commit -m "feat: wire dashboard todaySessions stat to real Session.countDocuments"
```

---

### Task 8: SessionForm component

**Files:**

- Create: `apps/web/src/components/sessions/SessionForm.tsx`

The form handles both create (no `session` prop) and edit (receives `session` prop). Students are passed in as a prop from the server component so the form gets names without an extra API call. The `datetime-local` input value is in `YYYY-MM-DDTHH:mm` format (local time); we convert it to ISO 8601 before sending to the API.

- [ ] **Step 1: Create SessionForm**

```bash
mkdir -p apps/web/src/components/sessions

cat << 'EOF' > apps/web/src/components/sessions/SessionForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublicSession, PublicStudent } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
]

type SessionFormProps = {
  students: PublicStudent[]
  session?: PublicSession
}

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'
const LABEL_CLS = 'block text-sm font-medium text-text-secondary'

function toDatetimeLocal(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SessionForm({ students, session }: SessionFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isEdit = !!session

  const defaultChecked = (studentId: string) =>
    session ? session.studentIds.includes(studentId) : false

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement).value

    const checkedStudents = students
      .filter((s) => (form.elements.namedItem(`student-${s._id}`) as HTMLInputElement)?.checked)
      .map((s) => s._id)

    if (checkedStudents.length === 0) {
      setError('Please select at least one student.')
      setLoading(false)
      return
    }

    const scheduledAtLocal = getValue('scheduledAt')
    const scheduledAt = new Date(scheduledAtLocal).toISOString()

    const body = {
      studentIds: checkedStudents,
      type: getValue('type'),
      scheduledAt,
      durationMinutes: parseInt(getValue('durationMinutes'), 10),
      notes: getValue('notes') || undefined,
    }

    try {
      const path = isEdit ? `/api/v1/sessions/${session._id}` : '/api/v1/sessions'
      const method = isEdit ? 'PATCH' : 'POST'
      await apiFetch(path, { method, body })
      router.push('/dashboard/sessions')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className={LABEL_CLS}>
          Students <span className="text-error">*</span>
        </span>
        {students.length === 0 ? (
          <p className="text-sm text-muted">
            No active students.{' '}
            <a href="/dashboard/students/new" className="text-accent underline">
              Add a student first.
            </a>
          </p>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
            {students.map((s) => (
              <label key={s._id} className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name={`student-${s._id}`}
                  defaultChecked={defaultChecked(s._id)}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                <span className="text-sm text-text-primary">{s.name}</span>
                <span className="text-xs capitalize text-muted">{s.skillLevel}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className={LABEL_CLS}>
            Session type
          </label>
          <select id="type" name="type" defaultValue={session?.type ?? 'private'} className={INPUT_CLS}>
            <option value="private">Private</option>
            <option value="group">Group</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="durationMinutes" className={LABEL_CLS}>
            Duration
          </label>
          <select
            id="durationMinutes"
            name="durationMinutes"
            defaultValue={session?.durationMinutes ?? 60}
            className={INPUT_CLS}
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="scheduledAt" className={LABEL_CLS}>
          Date &amp; time <span className="text-error">*</span>
        </label>
        <input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          required
          defaultValue={session ? toDatetimeLocal(session.scheduledAt) : undefined}
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className={LABEL_CLS}>
          Notes <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={session?.notes}
          placeholder="Session notes or focus areas"
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
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Schedule session'}
        </button>
        <a
          href="/dashboard/sessions"
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

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/sessions/SessionForm.tsx
git commit -m "feat: add SessionForm component for scheduling and editing"
```

---

### Task 9: SessionList component

**Files:**

- Create: `apps/web/src/components/sessions/SessionList.tsx`

Client component. Receives both sessions and students as props. Status badges are colour-coded. "Mark complete" and "Cancel" buttons appear for scheduled sessions only.

- [ ] **Step 1: Create SessionList**

```bash
cat << 'EOF' > apps/web/src/components/sessions/SessionList.tsx
'use client'

import { useRouter } from 'next/navigation'
import type { PublicSession, PublicStudent, SessionStatus } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const STATUS_PILL: Record<SessionStatus, string> = {
  scheduled: 'bg-accent/10 text-accent',
  completed: 'border border-border text-text-secondary',
  cancelled: 'bg-error/10 text-error',
}

const STATUS_LABEL: Record<SessionStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function formatDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

type SessionListProps = {
  sessions: PublicSession[]
  students: PublicStudent[]
}

export function SessionList({ sessions, students }: SessionListProps) {
  const router = useRouter()

  const studentMap = Object.fromEntries(students.map((s) => [s._id, s.name]))

  const updateStatus = async (id: string, status: SessionStatus) => {
    await apiFetch(`/api/v1/sessions/${id}`, { method: 'PATCH', body: { status } })
    router.refresh()
  }

  if (sessions.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-12 text-center">
        <p className="text-text-secondary">No sessions yet.</p>
        <a
          href="/dashboard/sessions/new"
          className="mt-4 inline-block rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-base"
        >
          Schedule your first session
        </a>
      </div>
    )
  }

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Date &amp; Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Students
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Duration
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Status
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {sessions.map((session, i) => (
            <tr
              key={session._id}
              className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surface/50'}`}
            >
              <td className="px-4 py-3 text-sm text-text-primary">
                {formatDate(session.scheduledAt)}
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">
                {session.studentIds
                  .map((id) => studentMap[id] ?? 'Unknown')
                  .join(', ')}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs capitalize text-text-secondary">{session.type}</span>
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">
                {formatDuration(session.durationMinutes)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${STATUS_PILL[session.status]}`}
                >
                  {STATUS_LABEL[session.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <a
                    href={`/dashboard/sessions/${session._id}/edit`}
                    className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
                  >
                    Edit
                  </a>
                  {session.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => updateStatus(session._id, 'completed')}
                        className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => updateStatus(session._id, 'cancelled')}
                        className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-error hover:text-error"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
EOF
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/sessions/SessionList.tsx
git commit -m "feat: add SessionList component with status pills and quick actions"
```

---

### Task 10: Sessions pages (list, new, edit)

**Files:**

- Create: `apps/web/src/app/(dashboard)/dashboard/sessions/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/sessions/new/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/sessions/[id]/edit/page.tsx`

All pages are server components. They fetch sessions AND students from the API and pass both to the client components.

- [ ] **Step 1: Create the sessions list page**

```bash
mkdir -p "apps/web/src/app/(dashboard)/dashboard/sessions"

cat << 'EOF' > "apps/web/src/app/(dashboard)/dashboard/sessions/page.tsx"
import type { PublicSession, PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { SessionList } from '@/components/sessions/SessionList'

export default async function SessionsPage() {
  const [sessions, students] = await Promise.all([
    serverApiFetch<PublicSession[]>('/api/v1/sessions'),
    serverApiFetch<PublicStudent[]>('/api/v1/students'),
  ])

  const scheduled = (sessions ?? []).filter((s) => s.status === 'scheduled').length

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-text-primary">Sessions</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {scheduled} upcoming session{scheduled !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="/dashboard/sessions/new"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-base transition-opacity hover:opacity-90"
        >
          + Schedule session
        </a>
      </div>

      <SessionList sessions={sessions ?? []} students={students ?? []} />
    </div>
  )
}
EOF
```

- [ ] **Step 2: Create the schedule session page**

```bash
mkdir -p "apps/web/src/app/(dashboard)/dashboard/sessions/new"

cat << 'EOF' > "apps/web/src/app/(dashboard)/dashboard/sessions/new/page.tsx"
import type { PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { SessionForm } from '@/components/sessions/SessionForm'

export default async function NewSessionPage() {
  const students = await serverApiFetch<PublicStudent[]>('/api/v1/students')

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Schedule Session</h1>
      <p className="mt-1 text-sm text-text-secondary">Add a new coaching session</p>
      <div className="mt-8">
        <SessionForm students={students ?? []} />
      </div>
    </div>
  )
}
EOF
```

- [ ] **Step 3: Create the edit session page**

```bash
mkdir -p "apps/web/src/app/(dashboard)/dashboard/sessions/[id]/edit"

cat << 'EOF' > "apps/web/src/app/(dashboard)/dashboard/sessions/[id]/edit/page.tsx"
import { redirect } from 'next/navigation'
import type { PublicSession, PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { SessionForm } from '@/components/sessions/SessionForm'

type Props = { params: Promise<{ id: string }> }

export default async function EditSessionPage({ params }: Props) {
  const { id } = await params
  const [session, students] = await Promise.all([
    serverApiFetch<PublicSession>(`/api/v1/sessions/${id}`),
    serverApiFetch<PublicStudent[]>('/api/v1/students'),
  ])
  if (!session) redirect('/dashboard/sessions')

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Edit Session</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {new Date(session.scheduledAt).toLocaleDateString('en-PH', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <div className="mt-8">
        <SessionForm session={session} students={students ?? []} />
      </div>
    </div>
  )
}
EOF
```

- [ ] **Step 4: TypeScript check (web)**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(dashboard)/dashboard/sessions/"
git commit -m "feat: add sessions list, schedule, and edit pages"
```

---

### Task 11: Manual browser verification

**Prerequisites:** MongoDB running. Start servers if not already running:

```bash
# Terminal 1
pnpm dev:api

# Terminal 2
pnpm dev:web
```

- [ ] **Step 1: Verify sessions list page**

1. Log in at `http://localhost:3000/login`
2. Navigate to `http://localhost:3000/dashboard/sessions`
3. Confirm: page title "Sessions", "0 upcoming sessions", "Schedule session" button
4. Confirm: sidebar "Sessions" nav item is highlighted Electric Lime

- [ ] **Step 2: Schedule a session**

1. Click "+ Schedule session"
2. Confirm: student checkboxes appear (uses students from Plan 4)
3. Check one student, set type to "Private", pick a date/time (today), duration "1 hour"
4. Click "Schedule session"
5. Confirm: redirect to `/dashboard/sessions`
6. Confirm: session appears in the table with "Scheduled" pill in Electric Lime
7. Confirm: "1 upcoming session" in the page subtitle

- [ ] **Step 3: Verify dashboard stat**

1. Navigate to `/dashboard`
2. Confirm: "Sessions Today" stat card shows **1** (since the session is scheduled for today)

- [ ] **Step 4: Mark session as complete**

1. Navigate back to `/dashboard/sessions`
2. Click "Complete" on the session row
3. Confirm: status pill changes to "Completed" (grey border)
4. Confirm: "Complete" and "Cancel" buttons disappear for that row

- [ ] **Step 5: Schedule and cancel a second session**

1. Schedule a second session with any student, today
2. Confirm: "1 upcoming session" (only the second one is scheduled; first is completed)
3. Click "Cancel" on the second session
4. Confirm: status pill changes to "Cancelled" (red tint)

- [ ] **Step 6: Verify dashboard stat after cancel**

1. Navigate to `/dashboard`
2. "Sessions Today" should show **1** (completed session counts; cancelled does not)

- [ ] **Step 7: Edit a session**

1. Navigate to `/dashboard/sessions`
2. Click "Edit" on any session
3. Confirm: form pre-fills date/time, student checkboxes, type, duration
4. Change notes to "Focused on dinking today"
5. Click "Save changes"
6. Confirm: redirect to sessions list

- [ ] **Step 8: TypeScript clean + all tests pass**

```bash
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
cd apps/api && node_modules/.bin/jest --no-coverage --runInBand 2>&1 | tail -10
```

Expected: Both TypeScript checks pass, all test suites pass.

- [ ] **Step 9: Final commit**

```bash
git add -A
git status
git commit -m "chore: session module complete and verified"
```

---

## What comes next

Plan 6 — Payments Module: `GET/POST/PATCH /api/v1/payments`. Payments link a session to a payment record with amount, method, and status (paid/unpaid/partial). The "Unpaid Balance" dashboard stat card gets wired to real data.
