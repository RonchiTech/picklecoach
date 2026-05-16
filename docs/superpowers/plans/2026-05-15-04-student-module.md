# Student Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full student CRUD — list, add, edit, and archive students — with a coach-scoped API and a dashboard UI that wires the "Total Students" stat card to real data.

**Architecture:** Follows the established Controller → Service → Repository pattern from the auth module. Every repository query is scoped to `coachId` from the JWT so coaches can never access each other's students. The web layer uses server components to fetch data and client components for mutations (StudentForm, StudentList). The dashboard stats service is updated to count real students from MongoDB.

**Tech Stack:** Express.js, Mongoose, Zod, Jest + Supertest (API); Next.js 15 App Router, Tailwind CSS v4 (web)

---

## File Map

**Shared**

- Create: `packages/shared/src/schemas/student.schema.ts` — Zod create/update schemas + inferred types
- Modify: `packages/shared/src/types/index.ts` — add `PublicStudent` interface
- Modify: `packages/shared/src/index.ts` — export student schema

**API — new module**

- Create: `apps/api/src/modules/student/student.model.ts`
- Create: `apps/api/src/modules/student/student.repository.ts`
- Create: `apps/api/src/modules/student/student.repository.test.ts`
- Create: `apps/api/src/modules/student/student.service.ts`
- Create: `apps/api/src/modules/student/student.service.test.ts`
- Create: `apps/api/src/modules/student/student.controller.ts`
- Create: `apps/api/src/modules/student/student.routes.ts`
- Create: `apps/api/src/modules/student/student.integration.test.ts`
- Modify: `apps/api/src/modules/dashboard/dashboard.service.ts` — count real students
- Modify: `apps/api/src/modules/dashboard/dashboard.service.test.ts` — mock Student model
- Modify: `apps/api/src/app.ts` — mount `/api/v1/students`

**Web — new files**

- Create: `apps/web/src/components/students/StudentForm.tsx` — add/edit form (client)
- Create: `apps/web/src/components/students/StudentList.tsx` — table with archive (client)
- Create: `apps/web/src/app/(dashboard)/dashboard/students/page.tsx` — list page (server)
- Create: `apps/web/src/app/(dashboard)/dashboard/students/new/page.tsx` — add page (server)
- Create: `apps/web/src/app/(dashboard)/dashboard/students/[id]/edit/page.tsx` — edit page (server)

---

### Task 1: Student schemas + types in shared package

**Files:**

- Create: `packages/shared/src/schemas/student.schema.ts`
- Modify: `packages/shared/src/types/index.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create student Zod schemas**

```bash
cat << 'EOF' > packages/shared/src/schemas/student.schema.ts
import { z } from 'zod'

export const createStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(7).max(20).optional().or(z.literal('')),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).default('beginner'),
  notes: z.string().max(1000).optional(),
})

export const updateStudentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(7).max(20).optional().or(z.literal('')),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).optional(),
  notes: z.string().max(1000).optional(),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
EOF
```

- [ ] **Step 2: Add PublicStudent interface to shared types**

Open `packages/shared/src/types/index.ts` and append at the bottom:

```typescript
export interface PublicStudent {
  _id: string
  coachId: string
  name: string
  email?: string
  phone?: string
  skillLevel: SkillLevel
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 3: Export student schema from shared index**

Open `packages/shared/src/index.ts` and add the new export:

```typescript
export * from './types/index'
export * from './schemas/auth.schema'
export * from './schemas/student.schema'
```

- [ ] **Step 4: Rebuild shared package**

```bash
pnpm --filter shared build
```

Expected: No errors. `dist/` regenerated.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/
git commit -m "feat: add student Zod schemas and PublicStudent type to shared package"
```

---

### Task 2: Student Mongoose model

**Files:**

- Create: `apps/api/src/modules/student/student.model.ts`

- [ ] **Step 1: Create the student model**

```bash
mkdir -p apps/api/src/modules/student

cat << 'EOF' > apps/api/src/modules/student/student.model.ts
import mongoose, { Document, Schema } from 'mongoose'
import type { SkillLevel } from '@picklecoach/shared'

export interface IStudent extends Document {
  _id: mongoose.Types.ObjectId
  coachId: mongoose.Types.ObjectId
  name: string
  email?: string
  phone?: string
  skillLevel: SkillLevel
  notes?: string
  isActive: boolean
}

const studentSchema = new Schema<IStudent>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'elite'],
      default: 'beginner',
    },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Student = mongoose.model<IStudent>('Student', studentSchema)
EOF
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/student/student.model.ts
git commit -m "feat: add Student Mongoose model"
```

---

### Task 3: Student repository (TDD — real DB)

**Files:**

- Create: `apps/api/src/modules/student/student.repository.test.ts`
- Create: `apps/api/src/modules/student/student.repository.ts`

The repository is always scoped to `coachId`. All queries filter by both `_id` and `coachId` so a coach cannot access another coach's students.

- [ ] **Step 1: Write the failing repository tests**

```bash
cat << 'EOF' > apps/api/src/modules/student/student.repository.test.ts
import mongoose from 'mongoose'
import { Student } from './student.model'
import { StudentRepository } from './student.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new StudentRepository()

const COACH_A = new mongoose.Types.ObjectId().toString()
const COACH_B = new mongoose.Types.ObjectId().toString()

const seed = (overrides: Record<string, unknown> = {}) =>
  Student.create({
    coachId: COACH_A,
    name: 'John Doe',
    skillLevel: 'beginner',
    isActive: true,
    ...overrides,
  })

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await Student.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await Student.deleteMany({})
})

describe('StudentRepository.findAllByCoach', () => {
  it('returns empty array when coach has no students', async () => {
    const result = await repo.findAllByCoach(COACH_A)
    expect(result).toEqual([])
  })

  it('returns only active students for the given coach', async () => {
    await seed({ name: 'Active Student' })
    await seed({ name: 'Archived Student', isActive: false })
    await seed({ coachId: COACH_B, name: 'Other Coach Student' })

    const result = await repo.findAllByCoach(COACH_A)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Active Student')
  })
})

describe('StudentRepository.findById', () => {
  it('returns null for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    expect(await repo.findById(fakeId, COACH_A)).toBeNull()
  })

  it('returns null when student belongs to a different coach', async () => {
    const student = await seed()
    expect(await repo.findById(student._id.toString(), COACH_B)).toBeNull()
  })

  it('returns the student when id and coachId match', async () => {
    const student = await seed({ name: 'Jane' })
    const found = await repo.findById(student._id.toString(), COACH_A)
    expect(found?.name).toBe('Jane')
  })
})

describe('StudentRepository.create', () => {
  it('creates and returns a student with coachId', async () => {
    const student = await repo.create({
      coachId: COACH_A,
      name: 'New Student',
      skillLevel: 'intermediate',
    })
    expect(student.name).toBe('New Student')
    expect(student.coachId.toString()).toBe(COACH_A)
    expect(student.isActive).toBe(true)
  })
})

describe('StudentRepository.update', () => {
  it('returns null when student not found or wrong coach', async () => {
    const student = await seed()
    expect(await repo.update(student._id.toString(), COACH_B, { name: 'Hacked' })).toBeNull()
  })

  it('updates and returns the updated student', async () => {
    const student = await seed()
    const updated = await repo.update(student._id.toString(), COACH_A, {
      name: 'Updated Name',
      skillLevel: 'advanced',
    })
    expect(updated?.name).toBe('Updated Name')
    expect(updated?.skillLevel).toBe('advanced')
  })
})

describe('StudentRepository.archive', () => {
  it('returns null when student not found or wrong coach', async () => {
    const student = await seed()
    expect(await repo.archive(student._id.toString(), COACH_B)).toBeNull()
  })

  it('sets isActive to false', async () => {
    const student = await seed()
    await repo.archive(student._id.toString(), COACH_A)
    const found = await Student.findById(student._id)
    expect(found?.isActive).toBe(false)
  })
})

describe('StudentRepository.countActiveByCoach', () => {
  it('returns 0 when coach has no active students', async () => {
    expect(await repo.countActiveByCoach(COACH_A)).toBe(0)
  })

  it('counts only active students for the given coach', async () => {
    await seed()
    await seed()
    await seed({ isActive: false })
    await seed({ coachId: COACH_B })

    expect(await repo.countActiveByCoach(COACH_A)).toBe(2)
  })
})
EOF
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && node_modules/.bin/jest student.repository.test --no-coverage --runInBand
```

Expected: FAIL — `Cannot find module './student.repository'`

- [ ] **Step 3: Write the repository**

```bash
cat << 'EOF' > apps/api/src/modules/student/student.repository.ts
import { IStudent, Student } from './student.model'
import type { CreateStudentInput, UpdateStudentInput } from '@picklecoach/shared'

type CreateData = Pick<CreateStudentInput, 'name' | 'email' | 'phone' | 'skillLevel' | 'notes'> & {
  coachId: string
}

export interface IStudentRepository {
  findAllByCoach(coachId: string): Promise<IStudent[]>
  findById(id: string, coachId: string): Promise<IStudent | null>
  create(data: CreateData): Promise<IStudent>
  update(id: string, coachId: string, data: UpdateStudentInput): Promise<IStudent | null>
  archive(id: string, coachId: string): Promise<IStudent | null>
  countActiveByCoach(coachId: string): Promise<number>
}

export class StudentRepository implements IStudentRepository {
  async findAllByCoach(coachId: string): Promise<IStudent[]> {
    return Student.find({ coachId, isActive: true }).sort({ name: 1 })
  }

  async findById(id: string, coachId: string): Promise<IStudent | null> {
    return Student.findOne({ _id: id, coachId })
  }

  async create(data: CreateData): Promise<IStudent> {
    return Student.create(data)
  }

  async update(id: string, coachId: string, data: UpdateStudentInput): Promise<IStudent | null> {
    return Student.findOneAndUpdate({ _id: id, coachId }, { $set: data }, { new: true })
  }

  async archive(id: string, coachId: string): Promise<IStudent | null> {
    return Student.findOneAndUpdate({ _id: id, coachId }, { $set: { isActive: false } }, { new: true })
  }

  async countActiveByCoach(coachId: string): Promise<number> {
    return Student.countDocuments({ coachId, isActive: true })
  }
}
EOF
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd apps/api && node_modules/.bin/jest student.repository.test --no-coverage --runInBand
```

Expected: PASS — all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/student/
git commit -m "feat: add StudentRepository with full CRUD scoped to coachId (TDD)"
```

---

### Task 4: Student service (TDD — mocked repo)

**Files:**

- Create: `apps/api/src/modules/student/student.service.test.ts`
- Create: `apps/api/src/modules/student/student.service.ts`

- [ ] **Step 1: Write the failing service tests**

```bash
cat << 'EOF' > apps/api/src/modules/student/student.service.test.ts
import { StudentService } from './student.service'
import type { IStudentRepository } from './student.repository'
import type { IStudent } from './student.model'
import mongoose from 'mongoose'

const COACH_ID = 'coach-123'
const STUDENT_ID = new mongoose.Types.ObjectId().toString()

const mockStudent = {
  _id: { toString: () => STUDENT_ID },
  coachId: { toString: () => COACH_ID },
  name: 'John Doe',
  skillLevel: 'beginner',
  isActive: true,
} as unknown as IStudent

const mockRepo: jest.Mocked<IStudentRepository> = {
  findAllByCoach: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  archive: jest.fn(),
  countActiveByCoach: jest.fn(),
}

let service: StudentService

beforeEach(() => {
  jest.clearAllMocks()
  service = new StudentService(mockRepo)
})

describe('StudentService.list', () => {
  it('returns students for the given coach', async () => {
    mockRepo.findAllByCoach.mockResolvedValue([mockStudent])
    const result = await service.list(COACH_ID)
    expect(result).toHaveLength(1)
    expect(mockRepo.findAllByCoach).toHaveBeenCalledWith(COACH_ID)
  })
})

describe('StudentService.getOne', () => {
  it('throws STUDENT_NOT_FOUND when student does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null)
    await expect(service.getOne(COACH_ID, STUDENT_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'STUDENT_NOT_FOUND',
    })
  })

  it('returns the student when found', async () => {
    mockRepo.findById.mockResolvedValue(mockStudent)
    const result = await service.getOne(COACH_ID, STUDENT_ID)
    expect(result.name).toBe('John Doe')
  })
})

describe('StudentService.create', () => {
  it('calls repo.create with coachId and returns the student', async () => {
    mockRepo.create.mockResolvedValue(mockStudent)
    const result = await service.create(COACH_ID, { name: 'John Doe', skillLevel: 'beginner' })
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ coachId: COACH_ID, name: 'John Doe' })
    )
    expect(result.name).toBe('John Doe')
  })
})

describe('StudentService.update', () => {
  it('throws STUDENT_NOT_FOUND when student does not exist or wrong coach', async () => {
    mockRepo.update.mockResolvedValue(null)
    await expect(service.update(COACH_ID, STUDENT_ID, { name: 'New' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'STUDENT_NOT_FOUND',
    })
  })

  it('returns the updated student', async () => {
    const updated = { ...mockStudent, name: 'Updated' } as unknown as IStudent
    mockRepo.update.mockResolvedValue(updated)
    const result = await service.update(COACH_ID, STUDENT_ID, { name: 'Updated' })
    expect(result.name).toBe('Updated')
  })
})

describe('StudentService.archive', () => {
  it('throws STUDENT_NOT_FOUND when student does not exist or wrong coach', async () => {
    mockRepo.archive.mockResolvedValue(null)
    await expect(service.archive(COACH_ID, STUDENT_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'STUDENT_NOT_FOUND',
    })
  })

  it('resolves without error when archive succeeds', async () => {
    mockRepo.archive.mockResolvedValue(mockStudent)
    await expect(service.archive(COACH_ID, STUDENT_ID)).resolves.toBeUndefined()
  })
})
EOF
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && node_modules/.bin/jest student.service.test --no-coverage
```

Expected: FAIL — `Cannot find module './student.service'`

- [ ] **Step 3: Write the service**

```bash
cat << 'EOF' > apps/api/src/modules/student/student.service.ts
import type { CreateStudentInput, UpdateStudentInput } from '@picklecoach/shared'
import type { IStudentRepository } from './student.repository'
import type { IStudent } from './student.model'
import { createError } from '../../middleware/error.middleware'

export class StudentService {
  constructor(private repo: IStudentRepository) {}

  async list(coachId: string): Promise<IStudent[]> {
    return this.repo.findAllByCoach(coachId)
  }

  async getOne(coachId: string, id: string): Promise<IStudent> {
    const student = await this.repo.findById(id, coachId)
    if (!student) throw createError('Student not found', 404, 'STUDENT_NOT_FOUND')
    return student
  }

  async create(coachId: string, input: CreateStudentInput): Promise<IStudent> {
    return this.repo.create({ ...input, coachId })
  }

  async update(coachId: string, id: string, input: UpdateStudentInput): Promise<IStudent> {
    const student = await this.repo.update(id, coachId, input)
    if (!student) throw createError('Student not found', 404, 'STUDENT_NOT_FOUND')
    return student
  }

  async archive(coachId: string, id: string): Promise<void> {
    const student = await this.repo.archive(id, coachId)
    if (!student) throw createError('Student not found', 404, 'STUDENT_NOT_FOUND')
  }
}
EOF
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd apps/api && node_modules/.bin/jest student.service.test --no-coverage
```

Expected: PASS — all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/student/
git commit -m "feat: add StudentService with list, getOne, create, update, archive (TDD)"
```

---

### Task 5: Student controller + routes

**Files:**

- Create: `apps/api/src/modules/student/student.controller.ts`
- Create: `apps/api/src/modules/student/student.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create the controller**

```bash
cat << 'EOF' > apps/api/src/modules/student/student.controller.ts
import type { Request, Response, NextFunction } from 'express'
import { createStudentSchema, updateStudentSchema } from '@picklecoach/shared'
import { StudentService } from './student.service'

export class StudentController {
  constructor(private service: StudentService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const students = await this.service.list(req.user!.userId)
      res.json({ success: true, data: students })
    } catch (err) {
      next(err)
    }
  }

  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await this.service.getOne(req.user!.userId, req.params.id)
      res.json({ success: true, data: student })
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createStudentSchema.parse(req.body)
      const student = await this.service.create(req.user!.userId, input)
      res.status(201).json({ success: true, data: student })
    } catch (err) {
      next(err)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateStudentSchema.parse(req.body)
      const student = await this.service.update(req.user!.userId, req.params.id, input)
      res.json({ success: true, data: student })
    } catch (err) {
      next(err)
    }
  }

  archive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.archive(req.user!.userId, req.params.id)
      res.json({ success: true, data: { message: 'Student archived' } })
    } catch (err) {
      next(err)
    }
  }
}
EOF
```

- [ ] **Step 2: Create the routes**

```bash
cat << 'EOF' > apps/api/src/modules/student/student.routes.ts
import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import { StudentRepository } from './student.repository'
import { StudentService } from './student.service'
import { StudentController } from './student.controller'

const router = Router()
const repo = new StudentRepository()
const service = new StudentService(repo)
const controller = new StudentController(service)

router.use(authenticate)
router.get('/', controller.list)
router.post('/', controller.create)
router.get('/:id', controller.getOne)
router.patch('/:id', controller.update)
router.delete('/:id', controller.archive)

export { router as studentRoutes }
EOF
```

- [ ] **Step 3: Mount student routes in app.ts**

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
import { studentRoutes } from './modules/student/student.routes'
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
git add apps/api/src/modules/student/ apps/api/src/app.ts
git commit -m "feat: add student controller, routes, mount at /api/v1/students"
```

---

### Task 6: Student integration test

**Files:**

- Create: `apps/api/src/modules/student/student.integration.test.ts`

- [ ] **Step 1: Write the integration tests**

```bash
cat << 'EOF' > apps/api/src/modules/student/student.integration.test.ts
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'
import { Student } from './student.model'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
  await Student.deleteMany({})
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

describe('GET /api/v1/students', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/students')
    expect(res.status).toBe(401)
  })

  it('returns empty array when coach has no students', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app).get('/api/v1/students').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('POST /api/v1/students', () => {
  it('creates a student and returns 201', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookie)
      .send({ name: 'Jane Smith', skillLevel: 'intermediate', email: 'jane@test.com' })

    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('Jane Smith')
    expect(res.body.data.skillLevel).toBe('intermediate')
    expect(res.body.data.isActive).toBe(true)
  })

  it('returns 400 VALIDATION_ERROR for invalid input', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookie)
      .send({ name: 'X' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns created student in subsequent GET', async () => {
    const cookie = await loginAndGetCookie()
    await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookie)
      .send({ name: 'Jane Smith', skillLevel: 'beginner' })

    const res = await request(app).get('/api/v1/students').set('Cookie', cookie)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].name).toBe('Jane Smith')
  })
})

describe('GET /api/v1/students/:id', () => {
  it('returns 404 STUDENT_NOT_FOUND for unknown id', async () => {
    const cookie = await loginAndGetCookie()
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app).get(`/api/v1/students/${fakeId}`).set('Cookie', cookie)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('STUDENT_NOT_FOUND')
  })

  it('returns the student when found', async () => {
    const cookie = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookie)
      .send({ name: 'Jane', skillLevel: 'beginner' })

    const res = await request(app)
      .get(`/api/v1/students/${created.body.data._id}`)
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Jane')
  })
})

describe('PATCH /api/v1/students/:id', () => {
  it('updates and returns the student', async () => {
    const cookie = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookie)
      .send({ name: 'Jane', skillLevel: 'beginner' })

    const res = await request(app)
      .patch(`/api/v1/students/${created.body.data._id}`)
      .set('Cookie', cookie)
      .send({ skillLevel: 'advanced', notes: 'Great progress' })

    expect(res.status).toBe(200)
    expect(res.body.data.skillLevel).toBe('advanced')
    expect(res.body.data.notes).toBe('Great progress')
  })

  it('returns 404 for a student belonging to another coach', async () => {
    const cookieA = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookieA)
      .send({ name: 'Jane', skillLevel: 'beginner' })

    await User.deleteMany({})
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach B', email: 'b@test.com', password: 'password123' })
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'b@test.com', password: 'password123' })
    const cookieB = loginB.headers['set-cookie'] as unknown as string[]

    const res = await request(app)
      .patch(`/api/v1/students/${created.body.data._id}`)
      .set('Cookie', cookieB)
      .send({ name: 'Hacked' })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/v1/students/:id', () => {
  it('archives the student (sets isActive to false)', async () => {
    const cookie = await loginAndGetCookie()
    const created = await request(app)
      .post('/api/v1/students')
      .set('Cookie', cookie)
      .send({ name: 'Jane', skillLevel: 'beginner' })

    const res = await request(app)
      .delete(`/api/v1/students/${created.body.data._id}`)
      .set('Cookie', cookie)

    expect(res.status).toBe(200)

    const list = await request(app).get('/api/v1/students').set('Cookie', cookie)
    expect(list.body.data).toHaveLength(0)
  })
})
EOF
```

- [ ] **Step 2: Run the integration tests**

```bash
cd apps/api && node_modules/.bin/jest student.integration.test --no-coverage --runInBand
```

Expected: PASS — all tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/student/student.integration.test.ts
git commit -m "test: add student module integration tests"
```

---

### Task 7: Wire dashboard stats to real student count

**Files:**

- Modify: `apps/api/src/modules/dashboard/dashboard.service.ts`
- Modify: `apps/api/src/modules/dashboard/dashboard.service.test.ts`

- [ ] **Step 1: Update dashboard service to query real student count**

Replace `apps/api/src/modules/dashboard/dashboard.service.ts`:

```bash
cat << 'EOF' > apps/api/src/modules/dashboard/dashboard.service.ts
import type { DashboardStats } from '@picklecoach/shared'
import { Student } from '../student/student.model'

export class DashboardService {
  async getStats(coachId: string): Promise<DashboardStats> {
    const totalStudents = await Student.countDocuments({ coachId, isActive: true })
    return { todaySessions: 0, totalStudents, unpaidBalance: 0 }
  }
}
EOF
```

- [ ] **Step 2: Update the dashboard service test to mock Student model**

Replace `apps/api/src/modules/dashboard/dashboard.service.test.ts`:

```bash
cat << 'EOF' > apps/api/src/modules/dashboard/dashboard.service.test.ts
import { DashboardService } from './dashboard.service'

jest.mock('../student/student.model', () => ({
  Student: { countDocuments: jest.fn() },
}))

import { Student } from '../student/student.model'

let service: DashboardService

beforeEach(() => {
  jest.clearAllMocks()
  service = new DashboardService()
  ;(Student.countDocuments as jest.Mock).mockResolvedValue(0)
})

describe('DashboardService.getStats', () => {
  it('returns zero stats when no students exist', async () => {
    const stats = await service.getStats('any-coach-id')
    expect(stats).toEqual({ todaySessions: 0, totalStudents: 0, unpaidBalance: 0 })
  })

  it('returns real student count from Student model', async () => {
    ;(Student.countDocuments as jest.Mock).mockResolvedValue(5)
    const stats = await service.getStats('coach-abc')
    expect(stats.totalStudents).toBe(5)
    expect(Student.countDocuments).toHaveBeenCalledWith({ coachId: 'coach-abc', isActive: true })
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

- [ ] **Step 3: Run dashboard service tests — verify they pass**

```bash
cd apps/api && node_modules/.bin/jest dashboard.service.test --no-coverage
```

Expected: PASS — 3 tests pass.

- [ ] **Step 4: Run all API tests to verify no regressions**

```bash
cd apps/api && node_modules/.bin/jest --no-coverage --runInBand
```

Expected: All test suites pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/dashboard/
git commit -m "feat: wire dashboard totalStudents stat to real Student.countDocuments"
```

---

### Task 8: StudentForm component

**Files:**

- Create: `apps/web/src/components/students/StudentForm.tsx`

Used for both adding (no `student` prop) and editing (receives `student` prop). Calls `POST /students` or `PATCH /students/:id` depending on mode.

- [ ] **Step 1: Create StudentForm**

```bash
mkdir -p apps/web/src/components/students

cat << 'EOF' > apps/web/src/components/students/StudentForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublicStudent } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'elite', label: 'Elite' },
] as const

type StudentFormProps = {
  student?: PublicStudent
}

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'
const LABEL_CLS = 'block text-sm font-medium text-text-secondary'

export function StudentForm({ student }: StudentFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isEdit = !!student

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
        .value

    const body = {
      name: getValue('name'),
      email: getValue('email') || undefined,
      phone: getValue('phone') || undefined,
      skillLevel: getValue('skillLevel'),
      notes: getValue('notes') || undefined,
    }

    try {
      const path = isEdit ? `/api/v1/students/${student._id}` : '/api/v1/students'
      const method = isEdit ? 'PATCH' : 'POST'
      await apiFetch(path, { method, body })
      router.push('/dashboard/students')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className={LABEL_CLS}>
          Full name <span className="text-error">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={student?.name}
          placeholder="e.g. Juan dela Cruz"
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="skillLevel" className={LABEL_CLS}>
          Skill level
        </label>
        <select id="skillLevel" name="skillLevel" defaultValue={student?.skillLevel ?? 'beginner'} className={INPUT_CLS}>
          {SKILL_LEVELS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={LABEL_CLS}>
          Email <span className="text-muted">(optional)</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={student?.email}
          placeholder="student@example.com"
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className={LABEL_CLS}>
          Phone <span className="text-muted">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          defaultValue={student?.phone}
          placeholder="09171234567"
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
          defaultValue={student?.notes}
          placeholder="Anything you want to remember about this student"
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
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add student'}
        </button>
        <a
          href="/dashboard/students"
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
git add apps/web/src/components/students/StudentForm.tsx
git commit -m "feat: add StudentForm component for add and edit"
```

---

### Task 9: StudentList component

**Files:**

- Create: `apps/web/src/components/students/StudentList.tsx`

Client component. Receives students as props. Each row has Edit and Archive buttons. Archive calls the API and refreshes the page.

- [ ] **Step 1: Create StudentList**

```bash
cat << 'EOF' > apps/web/src/components/students/StudentList.tsx
'use client'

import { useRouter } from 'next/navigation'
import type { PublicStudent, SkillLevel } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const SKILL_PILL: Record<SkillLevel, string> = {
  beginner: 'border border-border text-text-secondary',
  intermediate: 'bg-accent/10 text-accent',
  advanced: 'bg-accent/30 text-accent',
  elite: 'bg-accent text-base font-semibold',
}

const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  elite: 'Elite',
}

type StudentListProps = {
  students: PublicStudent[]
}

export function StudentList({ students }: StudentListProps) {
  const router = useRouter()

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Archive ${name}? They will no longer appear in your student list.`)) return
    await apiFetch(`/api/v1/students/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (students.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-12 text-center">
        <p className="text-text-secondary">No students yet.</p>
        <a
          href="/dashboard/students/new"
          className="mt-4 inline-block rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-base"
        >
          Add your first student
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
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Level
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Contact
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {students.map((student, i) => (
            <tr
              key={student._id}
              className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surface/50'}`}
            >
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-text-primary">{student.name}</p>
                {student.notes && (
                  <p className="mt-0.5 text-xs text-muted line-clamp-1">{student.notes}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${SKILL_PILL[student.skillLevel]}`}
                >
                  {SKILL_LABEL[student.skillLevel]}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">
                {student.email || student.phone || <span className="text-muted">—</span>}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <a
                    href={`/dashboard/students/${student._id}/edit`}
                    className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => handleArchive(student._id, student.name)}
                    className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-error hover:text-error"
                  >
                    Archive
                  </button>
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
git add apps/web/src/components/students/StudentList.tsx
git commit -m "feat: add StudentList component with skill pills and archive action"
```

---

### Task 10: Students pages (list, new, edit)

**Files:**

- Create: `apps/web/src/app/(dashboard)/dashboard/students/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/students/new/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/students/[id]/edit/page.tsx`

All pages are server components that fetch data via `serverApiFetch`.

- [ ] **Step 1: Create the students list page**

```bash
mkdir -p "apps/web/src/app/(dashboard)/dashboard/students"

cat << 'EOF' > "apps/web/src/app/(dashboard)/dashboard/students/page.tsx"
import type { PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { StudentList } from '@/components/students/StudentList'

export default async function StudentsPage() {
  const students = await serverApiFetch<PublicStudent[]>('/api/v1/students')

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-text-primary">Students</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {students?.length ?? 0} active student{students?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="/dashboard/students/new"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-base transition-opacity hover:opacity-90"
        >
          + Add student
        </a>
      </div>

      <StudentList students={students ?? []} />
    </div>
  )
}
EOF
```

- [ ] **Step 2: Create the add student page**

```bash
mkdir -p "apps/web/src/app/(dashboard)/dashboard/students/new"

cat << 'EOF' > "apps/web/src/app/(dashboard)/dashboard/students/new/page.tsx"
import { StudentForm } from '@/components/students/StudentForm'

export default function NewStudentPage() {
  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Add Student</h1>
      <p className="mt-1 text-sm text-text-secondary">Add a new student to your roster</p>
      <div className="mt-8">
        <StudentForm />
      </div>
    </div>
  )
}
EOF
```

- [ ] **Step 3: Create the edit student page**

```bash
mkdir -p "apps/web/src/app/(dashboard)/dashboard/students/[id]/edit"

cat << 'EOF' > "apps/web/src/app/(dashboard)/dashboard/students/[id]/edit/page.tsx"
import { redirect } from 'next/navigation'
import type { PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { StudentForm } from '@/components/students/StudentForm'

type Props = { params: Promise<{ id: string }> }

export default async function EditStudentPage({ params }: Props) {
  const { id } = await params
  const student = await serverApiFetch<PublicStudent>(`/api/v1/students/${id}`)
  if (!student) redirect('/dashboard/students')

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Edit Student</h1>
      <p className="mt-1 text-sm text-text-secondary">{student.name}</p>
      <div className="mt-8">
        <StudentForm student={student} />
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
git add "apps/web/src/app/(dashboard)/dashboard/students/"
git commit -m "feat: add students list, add, and edit pages"
```

---

### Task 11: Manual browser verification

**Prerequisites:** MongoDB running (`brew services list | grep mongodb`). Start servers if not already running:

```bash
# Terminal 1
pnpm dev:api

# Terminal 2
pnpm dev:web
```

- [ ] **Step 1: Verify students list page**

1. Log in at `http://localhost:3000/login`
2. Navigate to `http://localhost:3000/dashboard/students`
3. Confirm: page title "Students", "0 active students", "Add student" button
4. Confirm: sidebar "Students" nav item is highlighted Electric Lime

- [ ] **Step 2: Add a student**

1. Click "Add student"
2. Fill: Name = "Juan dela Cruz", Skill = "Intermediate", Email = "juan@test.com"
3. Click "Add student"
4. Confirm: redirect back to `/dashboard/students`
5. Confirm: "Juan dela Cruz" appears in the list with an "Intermediate" pill in accent color
6. Confirm: "1 active student" count in the page subtitle

- [ ] **Step 3: Verify dashboard stats update**

1. Navigate to `/dashboard`
2. Confirm: "Total Students" stat card now shows **1**

- [ ] **Step 4: Edit the student**

1. Navigate back to `/dashboard/students`
2. Click "Edit" next to Juan
3. Confirm: form pre-fills with "Juan dela Cruz", "intermediate"
4. Change skill level to "Advanced", add notes "Strong backhand"
5. Click "Save changes"
6. Confirm: redirect to students list, row shows "Advanced" pill

- [ ] **Step 5: Add a second student, then archive**

1. Add a second student: "Maria Santos", Beginner
2. Confirm: "2 active students"
3. Click "Archive" on Juan
4. Confirm browser confirmation dialog ("Archive Juan dela Cruz?...")
5. Confirm: list shows only Maria, "1 active student"
6. Navigate to `/dashboard` — confirm "Total Students" shows **1**

- [ ] **Step 6: Verify TypeScript is clean**

```bash
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
```

Expected: Both pass with no errors.

- [ ] **Step 7: Run all API tests**

```bash
cd apps/api && node_modules/.bin/jest --no-coverage --runInBand
```

Expected: All test suites pass.

- [ ] **Step 8: Final commit**

```bash
git add -A
git status
git commit -m "chore: student module complete and verified"
```

---

## What comes next

Plan 5 — Session Module: `GET/POST/PATCH/DELETE /api/v1/sessions`. Sessions have a `studentIds[]` array linking to students built in this plan. The "Sessions Today" dashboard stat card gets wired to real data. The Sessions page in the dashboard lets coaches schedule private or group sessions, assign students from the roster, and mark sessions as completed or cancelled.
