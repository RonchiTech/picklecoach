# Public Profile Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let coaches configure their public listing (bio, photo, specializations, rates, contact preferences) from a new `/dashboard/public-profile` page, backed by a separate `coach_profiles` MongoDB collection auto-created on registration.

**Architecture:** New `coach_profiles` module (model → repository → service → controller → routes) following the existing OOP pattern. `AuthService` receives an `onRegister` callback that creates the profile record after user creation — keeping the modules decoupled. Photo upload goes to our API → proxied to Cloudinary. Slug auto-generated with uniqueness retry loop.

**Tech Stack:** Express.js + Mongoose + TypeScript + Zod (API); Next.js 15 App Router + Tailwind CSS v4 (web); Cloudinary Node SDK + multer (photo upload); Jest + Supertest (tests).

---

## File Map

**Create:**

- `packages/shared/src/schemas/coach-profile.schema.ts`
- `apps/api/src/config/cloudinary.ts`
- `apps/api/src/modules/coach-profile/coach-profile.model.ts`
- `apps/api/src/modules/coach-profile/coach-profile.repository.ts`
- `apps/api/src/modules/coach-profile/coach-profile.repository.test.ts`
- `apps/api/src/modules/coach-profile/coach-profile.service.ts`
- `apps/api/src/modules/coach-profile/coach-profile.service.test.ts`
- `apps/api/src/modules/coach-profile/coach-profile.controller.ts`
- `apps/api/src/modules/coach-profile/coach-profile.routes.ts`
- `apps/api/src/modules/coach-profile/coach-profile.integration.test.ts`
- `apps/web/src/components/public-profile/IdentityForm.tsx`
- `apps/web/src/components/public-profile/CoachingDetailsForm.tsx`
- `apps/web/src/components/public-profile/RatesForm.tsx`
- `apps/web/src/components/public-profile/ContactVisibilityForm.tsx`
- `apps/web/src/app/(dashboard)/dashboard/public-profile/page.tsx`

**Modify:**

- `packages/shared/src/types/index.ts` — add `PublicCoachProfile`
- `packages/shared/src/index.ts` — export coach-profile schema
- `apps/api/src/config/env.ts` — add Cloudinary env vars
- `apps/api/src/modules/auth/auth.service.ts` — accept `onRegister` callback
- `apps/api/src/modules/auth/auth.service.test.ts` — update service constructor call
- `apps/api/src/modules/auth/auth.routes.ts` — pass `onRegister` callback
- `apps/api/src/app.ts` — mount `/api/v1/coach-profiles` routes
- `apps/web/src/components/dashboard/Sidebar.tsx` — add Public Profile nav item

---

## Task 1: Shared package — PublicCoachProfile type + schema

**Files:**

- Modify: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/schemas/coach-profile.schema.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Add PublicCoachProfile to types/index.ts**

Append to the end of `packages/shared/src/types/index.ts`:

```typescript
export interface PublicCoachProfile {
  _id: string
  coachId: string
  slug: string
  isPublic: boolean
  displayName: string
  bio?: string
  photoUrl?: string
  city?: string
  specializations: string[]
  sessionTypes: SessionType[]
  privateRate?: number
  groupRate?: number
  ratesNote?: string
  contactEmail?: string
  contactPhone?: string
  showContactInfo: boolean
  totalViews: number
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Create coach-profile.schema.ts**

Create `packages/shared/src/schemas/coach-profile.schema.ts`:

```typescript
import { z } from 'zod'

export const SPECIALIZATIONS = [
  'beginner',
  'intermediate',
  'advanced',
  'dinking',
  'serve',
  '3rd-shot-drop',
  'footwork',
  'strategy',
  'doubles',
  'singles',
] as const

export const updateCoachProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').optional(),
  bio: z.string().optional(),
  city: z.string().optional(),
  specializations: z.array(z.enum(SPECIALIZATIONS)).optional(),
  sessionTypes: z.array(z.enum(['private', 'group'])).optional(),
  privateRate: z.number().min(0).optional(),
  groupRate: z.number().min(0).optional(),
  ratesNote: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
  showContactInfo: z.boolean().optional(),
  isPublic: z.boolean().optional(),
})

export type UpdateCoachProfileInput = z.infer<typeof updateCoachProfileSchema>
```

- [ ] **Step 3: Export from shared index**

In `packages/shared/src/index.ts`, add:

```typescript
export * from './schemas/coach-profile.schema'
```

- [ ] **Step 4: Rebuild shared**

```bash
cd packages/shared && pnpm build
```

Expected: `tsc` runs silently with exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/types/index.ts packages/shared/src/schemas/coach-profile.schema.ts packages/shared/src/index.ts
git commit -m "feat: add PublicCoachProfile type and updateCoachProfileSchema to shared"
```

---

## Task 2: Install packages + Cloudinary env config

**Files:**

- Modify: `apps/api/src/config/env.ts`
- Create: `apps/api/src/config/cloudinary.ts`

- [ ] **Step 1: Install cloudinary and multer**

```bash
cd apps/api && pnpm add cloudinary multer && pnpm add -D @types/multer
```

Expected: packages added to `apps/api/package.json`.

- [ ] **Step 2: Add Cloudinary env vars to env.ts**

In `apps/api/src/config/env.ts`, update `envSchema`:

```typescript
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
})
```

Using `.default('')` so the server starts without Cloudinary configured (photo upload simply fails at call time, not at startup).

- [ ] **Step 3: Create cloudinary config**

Create `apps/api/src/config/cloudinary.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary'
import { env } from './env'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export { cloudinary }
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/config/env.ts apps/api/src/config/cloudinary.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat: install cloudinary + multer, add env vars"
```

---

## Task 3: Coach profile Mongoose model

**Files:**

- Create: `apps/api/src/modules/coach-profile/coach-profile.model.ts`

- [ ] **Step 1: Create the model**

Create `apps/api/src/modules/coach-profile/coach-profile.model.ts`:

```typescript
import mongoose, { Document, Schema } from 'mongoose'

export interface ICoachProfile extends Document {
  _id: mongoose.Types.ObjectId
  coachId: mongoose.Types.ObjectId
  slug: string
  isPublic: boolean
  displayName: string
  bio?: string
  photoUrl?: string
  city?: string
  specializations: string[]
  sessionTypes: ('private' | 'group')[]
  privateRate?: number
  groupRate?: number
  ratesNote?: string
  contactEmail?: string
  contactPhone?: string
  showContactInfo: boolean
  totalViews: number
}

const coachProfileSchema = new Schema<ICoachProfile>(
  {
    coachId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    slug: { type: String, required: true, unique: true, trim: true },
    isPublic: { type: Boolean, default: false },
    displayName: { type: String, required: true, trim: true },
    bio: { type: String },
    photoUrl: { type: String },
    city: { type: String, trim: true },
    specializations: { type: [String], default: [] },
    sessionTypes: { type: [String], enum: ['private', 'group'], default: [] },
    privateRate: { type: Number },
    groupRate: { type: Number },
    ratesNote: { type: String },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    showContactInfo: { type: Boolean, default: false },
    totalViews: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const CoachProfile = mongoose.model<ICoachProfile>('CoachProfile', coachProfileSchema)
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/modules/coach-profile/coach-profile.model.ts
git commit -m "feat: add CoachProfile Mongoose model"
```

---

## Task 4: Repository TDD

**Files:**

- Create: `apps/api/src/modules/coach-profile/coach-profile.repository.ts`
- Create: `apps/api/src/modules/coach-profile/coach-profile.repository.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/api/src/modules/coach-profile/coach-profile.repository.test.ts`:

```typescript
import mongoose from 'mongoose'
import { CoachProfile } from './coach-profile.model'
import { CoachProfileRepository } from './coach-profile.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new CoachProfileRepository()

const COACH_A = new mongoose.Types.ObjectId().toString()
const COACH_B = new mongoose.Types.ObjectId().toString()

const seed = (overrides: Record<string, unknown> = {}) =>
  CoachProfile.create({
    coachId: COACH_A,
    slug: 'coach-ron-a1b2',
    displayName: 'Coach Ron',
    isPublic: false,
    specializations: [],
    sessionTypes: [],
    showContactInfo: false,
    totalViews: 0,
    ...overrides,
  })

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await CoachProfile.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await CoachProfile.deleteMany({})
})

describe('CoachProfileRepository.create', () => {
  it('creates a profile with the given coachId and slug', async () => {
    const profile = await repo.create({
      coachId: COACH_A,
      slug: 'coach-ron-a1b2',
      displayName: 'Coach Ron',
    })
    expect(profile.coachId.toString()).toBe(COACH_A)
    expect(profile.slug).toBe('coach-ron-a1b2')
    expect(profile.isPublic).toBe(false)
    expect(profile.totalViews).toBe(0)
  })
})

describe('CoachProfileRepository.findByCoachId', () => {
  it('returns null when no profile exists', async () => {
    const result = await repo.findByCoachId(COACH_A)
    expect(result).toBeNull()
  })

  it('returns the profile for the given coachId', async () => {
    await seed()
    const result = await repo.findByCoachId(COACH_A)
    expect(result?.displayName).toBe('Coach Ron')
  })

  it('returns null for a different coachId', async () => {
    await seed()
    const result = await repo.findByCoachId(COACH_B)
    expect(result).toBeNull()
  })
})

describe('CoachProfileRepository.findBySlug', () => {
  it('returns null when slug does not exist', async () => {
    const result = await repo.findBySlug('nonexistent-slug')
    expect(result).toBeNull()
  })

  it('returns the profile when slug matches', async () => {
    await seed()
    const result = await repo.findBySlug('coach-ron-a1b2')
    expect(result?.coachId.toString()).toBe(COACH_A)
  })
})

describe('CoachProfileRepository.update', () => {
  it('returns null when profile does not exist', async () => {
    const result = await repo.update(COACH_A, { displayName: 'New Name' })
    expect(result).toBeNull()
  })

  it('updates fields and returns the updated profile', async () => {
    await seed()
    const result = await repo.update(COACH_A, {
      displayName: 'Updated',
      city: 'Makati',
      isPublic: true,
    })
    expect(result?.displayName).toBe('Updated')
    expect(result?.city).toBe('Makati')
    expect(result?.isPublic).toBe(true)
  })
})

describe('CoachProfileRepository.updatePhoto', () => {
  it('returns null when profile does not exist', async () => {
    const result = await repo.updatePhoto(COACH_A, 'https://example.com/photo.jpg')
    expect(result).toBeNull()
  })

  it('sets photoUrl and returns the updated profile', async () => {
    await seed()
    const result = await repo.updatePhoto(COACH_A, 'https://res.cloudinary.com/test/image.jpg')
    expect(result?.photoUrl).toBe('https://res.cloudinary.com/test/image.jpg')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/api && node_modules/.bin/jest --testPathPattern="coach-profile.repository" --no-coverage
```

Expected: FAIL — `CoachProfileRepository` not found.

- [ ] **Step 3: Implement the repository**

Create `apps/api/src/modules/coach-profile/coach-profile.repository.ts`:

```typescript
import { CoachProfile, ICoachProfile } from './coach-profile.model'

type CreateData = {
  coachId: string
  slug: string
  displayName: string
}

type UpdateData = {
  displayName?: string
  bio?: string
  city?: string
  specializations?: string[]
  sessionTypes?: ('private' | 'group')[]
  privateRate?: number
  groupRate?: number
  ratesNote?: string
  contactEmail?: string
  contactPhone?: string
  showContactInfo?: boolean
  isPublic?: boolean
}

export interface ICoachProfileRepository {
  create(data: CreateData): Promise<ICoachProfile>
  findByCoachId(coachId: string): Promise<ICoachProfile | null>
  findBySlug(slug: string): Promise<ICoachProfile | null>
  update(coachId: string, data: UpdateData): Promise<ICoachProfile | null>
  updatePhoto(coachId: string, photoUrl: string): Promise<ICoachProfile | null>
}

export class CoachProfileRepository implements ICoachProfileRepository {
  async create(data: CreateData): Promise<ICoachProfile> {
    return CoachProfile.create(data)
  }

  async findByCoachId(coachId: string): Promise<ICoachProfile | null> {
    return CoachProfile.findOne({ coachId })
  }

  async findBySlug(slug: string): Promise<ICoachProfile | null> {
    return CoachProfile.findOne({ slug })
  }

  async update(coachId: string, data: UpdateData): Promise<ICoachProfile | null> {
    return CoachProfile.findOneAndUpdate({ coachId }, { $set: data }, { new: true })
  }

  async updatePhoto(coachId: string, photoUrl: string): Promise<ICoachProfile | null> {
    return CoachProfile.findOneAndUpdate({ coachId }, { $set: { photoUrl } }, { new: true })
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd apps/api && node_modules/.bin/jest --testPathPattern="coach-profile.repository" --no-coverage
```

Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/coach-profile/coach-profile.repository.ts apps/api/src/modules/coach-profile/coach-profile.repository.test.ts
git commit -m "feat: add CoachProfileRepository with TDD"
```

---

## Task 5: Service TDD — getMyProfile, createForCoach, updateProfile

**Files:**

- Create: `apps/api/src/modules/coach-profile/coach-profile.service.ts`
- Create: `apps/api/src/modules/coach-profile/coach-profile.service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/api/src/modules/coach-profile/coach-profile.service.test.ts`:

```typescript
import { CoachProfileService } from './coach-profile.service'
import type { ICoachProfileRepository } from './coach-profile.repository'
import type { ICoachProfile } from './coach-profile.model'

const mockProfile = {
  _id: { toString: () => '507f1f77bcf86cd799439011' },
  coachId: { toString: () => '507f1f77bcf86cd799439012' },
  slug: 'coach-ron-a1b2',
  isPublic: false,
  displayName: 'Coach Ron',
  specializations: [],
  sessionTypes: [],
  showContactInfo: false,
  totalViews: 0,
} as unknown as ICoachProfile

const mockRepo: jest.Mocked<ICoachProfileRepository> = {
  create: jest.fn(),
  findByCoachId: jest.fn(),
  findBySlug: jest.fn(),
  update: jest.fn(),
  updatePhoto: jest.fn(),
}

let service: CoachProfileService

beforeEach(() => {
  jest.clearAllMocks()
  service = new CoachProfileService(mockRepo)
})

describe('CoachProfileService.getMyProfile', () => {
  it('throws PROFILE_NOT_FOUND when profile does not exist', async () => {
    mockRepo.findByCoachId.mockResolvedValue(null)
    await expect(service.getMyProfile('coach-id')).rejects.toMatchObject({
      code: 'PROFILE_NOT_FOUND',
      statusCode: 404,
    })
  })

  it('returns the profile when found', async () => {
    mockRepo.findByCoachId.mockResolvedValue(mockProfile)
    const result = await service.getMyProfile('coach-id')
    expect(result.slug).toBe('coach-ron-a1b2')
  })
})

describe('CoachProfileService.createForCoach', () => {
  it('calls repo.findBySlug until a unique slug is found, then creates', async () => {
    mockRepo.findBySlug.mockResolvedValueOnce(mockProfile) // first slug taken
    mockRepo.findBySlug.mockResolvedValueOnce(null) // second slug free
    mockRepo.create.mockResolvedValue(mockProfile)
    await service.createForCoach('coach-id', 'Coach Ron')
    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(2)
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ coachId: 'coach-id', displayName: 'Coach Ron' })
    )
  })

  it('throws SLUG_GENERATION_FAILED after 5 collisions', async () => {
    mockRepo.findBySlug.mockResolvedValue(mockProfile) // always taken
    await expect(service.createForCoach('coach-id', 'Coach Ron')).rejects.toMatchObject({
      code: 'SLUG_GENERATION_FAILED',
      statusCode: 500,
    })
    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(5)
    expect(mockRepo.create).not.toHaveBeenCalled()
  })
})

describe('CoachProfileService.updateProfile', () => {
  it('throws PROFILE_NOT_FOUND when repo.update returns null', async () => {
    mockRepo.update.mockResolvedValue(null)
    await expect(service.updateProfile('coach-id', { displayName: 'New' })).rejects.toMatchObject({
      code: 'PROFILE_NOT_FOUND',
      statusCode: 404,
    })
  })

  it('returns the updated profile', async () => {
    const updated = { ...mockProfile, displayName: 'New Name' } as unknown as ICoachProfile
    mockRepo.update.mockResolvedValue(updated)
    const result = await service.updateProfile('coach-id', { displayName: 'New Name' })
    expect(result.displayName).toBe('New Name')
    expect(mockRepo.update).toHaveBeenCalledWith('coach-id', { displayName: 'New Name' })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/api && node_modules/.bin/jest --testPathPattern="coach-profile.service.test" --no-coverage
```

Expected: FAIL — `CoachProfileService` not found.

- [ ] **Step 3: Implement the service (without uploadPhoto for now)**

Create `apps/api/src/modules/coach-profile/coach-profile.service.ts`:

```typescript
import type { UpdateCoachProfileInput } from '@picklecoach/shared'
import type { ICoachProfileRepository } from './coach-profile.repository'
import type { ICoachProfile } from './coach-profile.model'
import { createError } from '../../middleware/error.middleware'

export class CoachProfileService {
  constructor(private repo: ICoachProfileRepository) {}

  async getMyProfile(coachId: string): Promise<ICoachProfile> {
    const profile = await this.repo.findByCoachId(coachId)
    if (!profile) throw createError('Profile not found', 404, 'PROFILE_NOT_FOUND')
    return profile
  }

  async createForCoach(coachId: string, name: string): Promise<void> {
    const slug = await this.generateUniqueSlug(name)
    await this.repo.create({ coachId, slug, displayName: name })
  }

  async updateProfile(coachId: string, input: UpdateCoachProfileInput): Promise<ICoachProfile> {
    const profile = await this.repo.update(coachId, input)
    if (!profile) throw createError('Profile not found', 404, 'PROFILE_NOT_FOUND')
    return profile
  }

  async uploadPhoto(_coachId: string, _buffer: Buffer): Promise<ICoachProfile> {
    throw createError('Not implemented', 501, 'NOT_IMPLEMENTED')
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    for (let i = 0; i < 5; i++) {
      const suffix = Math.random().toString(36).slice(2, 6)
      const candidate = `${base}-${suffix}`
      const exists = await this.repo.findBySlug(candidate)
      if (!exists) return candidate
    }
    throw createError('Could not generate unique slug', 500, 'SLUG_GENERATION_FAILED')
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd apps/api && node_modules/.bin/jest --testPathPattern="coach-profile.service.test" --no-coverage
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/coach-profile/coach-profile.service.ts apps/api/src/modules/coach-profile/coach-profile.service.test.ts
git commit -m "feat: add CoachProfileService with TDD (getMyProfile, createForCoach, updateProfile)"
```

---

## Task 6: Service TDD — uploadPhoto with Cloudinary

**Files:**

- Modify: `apps/api/src/modules/coach-profile/coach-profile.service.ts`
- Modify: `apps/api/src/modules/coach-profile/coach-profile.service.test.ts`

- [ ] **Step 1: Add failing uploadPhoto tests**

Append to `apps/api/src/modules/coach-profile/coach-profile.service.test.ts` (before the last closing brace):

```typescript
jest.mock('../../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: jest.fn(
        (_opts: unknown, cb: (err: null, result: { secure_url: string }) => void) => {
          cb(null, { secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg' })
          return { end: jest.fn() }
        }
      ),
    },
  },
}))

describe('CoachProfileService.uploadPhoto', () => {
  it('throws PROFILE_NOT_FOUND when repo.updatePhoto returns null', async () => {
    mockRepo.updatePhoto.mockResolvedValue(null)
    const buffer = Buffer.from('fake-image')
    await expect(service.uploadPhoto('coach-id', buffer)).rejects.toMatchObject({
      code: 'PROFILE_NOT_FOUND',
      statusCode: 404,
    })
  })

  it('uploads to Cloudinary and updates the profile photoUrl', async () => {
    const updated = {
      ...mockProfile,
      photoUrl: 'https://res.cloudinary.com/test/image/upload/test.jpg',
    } as unknown as ICoachProfile
    mockRepo.updatePhoto.mockResolvedValue(updated)
    const buffer = Buffer.from('fake-image')
    const result = await service.uploadPhoto('coach-id', buffer)
    expect(result.photoUrl).toBe('https://res.cloudinary.com/test/image/upload/test.jpg')
    expect(mockRepo.updatePhoto).toHaveBeenCalledWith(
      'coach-id',
      'https://res.cloudinary.com/test/image/upload/test.jpg'
    )
  })
})
```

- [ ] **Step 2: Run tests to confirm uploadPhoto tests fail**

```bash
cd apps/api && node_modules/.bin/jest --testPathPattern="coach-profile.service.test" --no-coverage
```

Expected: 2 new tests fail (NOT_IMPLEMENTED).

- [ ] **Step 3: Implement uploadPhoto in the service**

Replace the stub `uploadPhoto` method in `apps/api/src/modules/coach-profile/coach-profile.service.ts`:

```typescript
async uploadPhoto(coachId: string, buffer: Buffer): Promise<ICoachProfile> {
  const photoUrl = await this.uploadToCloudinary(buffer)
  const profile = await this.repo.updatePhoto(coachId, photoUrl)
  if (!profile) throw createError('Profile not found', 404, 'PROFILE_NOT_FOUND')
  return profile
}

private uploadToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const { cloudinary } = require('../../config/cloudinary') as { cloudinary: import('cloudinary').v2 }
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'picklecoach/profiles', resource_type: 'image' },
      (error: Error | undefined, result: { secure_url: string } | undefined) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'))
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}
```

- [ ] **Step 4: Run all service tests to confirm 8 pass**

```bash
cd apps/api && node_modules/.bin/jest --testPathPattern="coach-profile.service.test" --no-coverage
```

Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/coach-profile/coach-profile.service.ts apps/api/src/modules/coach-profile/coach-profile.service.test.ts
git commit -m "feat: add uploadPhoto to CoachProfileService with Cloudinary integration"
```

---

## Task 7: Auth service — create profile on registration

**Files:**

- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Modify: `apps/api/src/modules/auth/auth.service.test.ts`
- Modify: `apps/api/src/modules/auth/auth.routes.ts`

- [ ] **Step 1: Add failing test for registration callback**

In `apps/api/src/modules/auth/auth.service.test.ts`, add `onRegister` to the mock setup. Replace the `let service: AuthService` and `beforeEach` block:

```typescript
const mockOnRegister = jest.fn()

let service: AuthService

beforeEach(() => {
  jest.clearAllMocks()
  service = new AuthService(mockRepo, mockOnRegister)
})
```

And add a new test to the `AuthService.register` describe block:

```typescript
it('calls onRegister with the new userId and name after creating the user', async () => {
  mockRepo.emailExists.mockResolvedValue(false)
  mockRepo.create.mockResolvedValue(mockUser)
  mockOnRegister.mockResolvedValue(undefined)
  await service.register({ name: 'Ron', email: 'ron@test.com', password: 'password123' })
  expect(mockOnRegister).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'Coach Ron')
})
```

- [ ] **Step 2: Run tests to confirm new test fails**

```bash
cd apps/api && node_modules/.bin/jest --testPathPattern="auth.service.test" --no-coverage
```

Expected: compilation error — `AuthService` constructor doesn't accept `onRegister`.

- [ ] **Step 3: Update AuthService to accept onRegister callback**

In `apps/api/src/modules/auth/auth.service.ts`, update the constructor and `register` method:

```typescript
type OnRegisterFn = (userId: string, name: string) => Promise<void>

export class AuthService {
  constructor(
    private repo: IAuthRepository,
    private onRegister: OnRegisterFn = async () => {},
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const exists = await this.repo.emailExists(input.email)
    if (exists) throw createError('Email already in use', 409, 'EMAIL_TAKEN')

    const passwordHash = await bcrypt.hash(input.password, 12)
    const user = await this.repo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
    })

    await this.onRegister(user._id.toString(), user.name)

    return { user: this.sanitize(user), token: this.signToken(user) }
  }

  // ... rest unchanged
```

- [ ] **Step 4: Run auth service tests to confirm all pass**

```bash
cd apps/api && node_modules/.bin/jest --testPathPattern="auth.service.test" --no-coverage
```

Expected: 15 tests pass.

- [ ] **Step 5: Wire up onRegister in auth.routes.ts**

In `apps/api/src/modules/auth/auth.routes.ts`:

```typescript
import { Router } from 'express'
import { UserRepository } from './auth.repository'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { authenticate } from '../../middleware/auth.middleware'
import { CoachProfileRepository } from '../coach-profile/coach-profile.repository'
import { CoachProfileService } from '../coach-profile/coach-profile.service'

const router = Router()
const repo = new UserRepository()
const coachProfileRepo = new CoachProfileRepository()
const coachProfileService = new CoachProfileService(coachProfileRepo)
const service = new AuthService(repo, (userId, name) =>
  coachProfileService.createForCoach(userId, name)
)
const controller = new AuthController(service)

router.post('/register', controller.register)
router.post('/login', controller.login)
router.post('/logout', controller.logout)
router.get('/me', authenticate, controller.me)
router.patch('/profile', authenticate, controller.updateProfile)
router.patch('/password', authenticate, controller.changePassword)

export { router as authRoutes }
```

- [ ] **Step 6: Run auth integration tests to confirm they still pass**

```bash
cd apps/api && node_modules/.bin/jest --testPathPattern="auth.integration" --no-coverage
```

Expected: 16 tests pass (registration now also creates a coach profile silently).

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/auth.service.test.ts apps/api/src/modules/auth/auth.routes.ts
git commit -m "feat: create coach profile on registration via onRegister callback"
```

---

## Task 8: Controller + routes

**Files:**

- Create: `apps/api/src/modules/coach-profile/coach-profile.controller.ts`
- Create: `apps/api/src/modules/coach-profile/coach-profile.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create the controller**

Create `apps/api/src/modules/coach-profile/coach-profile.controller.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express'
import { updateCoachProfileSchema } from '@picklecoach/shared'
import { CoachProfileService } from './coach-profile.service'
import { createError } from '../../middleware/error.middleware'

export class CoachProfileController {
  constructor(private service: CoachProfileService) {}

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.service.getMyProfile(req.user!.userId)
      res.json({ success: true, data: profile })
    } catch (err) {
      next(err)
    }
  }

  updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateCoachProfileSchema.parse(req.body)
      const profile = await this.service.updateProfile(req.user!.userId, input)
      res.json({ success: true, data: profile })
    } catch (err) {
      next(err)
    }
  }

  uploadPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) throw createError('No file uploaded', 400, 'NO_FILE')
      const profile = await this.service.uploadPhoto(req.user!.userId, req.file.buffer)
      res.json({ success: true, data: { photoUrl: profile.photoUrl } })
    } catch (err) {
      next(err)
    }
  }
}
```

- [ ] **Step 2: Create the routes file**

Create `apps/api/src/modules/coach-profile/coach-profile.routes.ts`:

```typescript
import { Router } from 'express'
import multer from 'multer'
import { CoachProfileRepository } from './coach-profile.repository'
import { CoachProfileService } from './coach-profile.service'
import { CoachProfileController } from './coach-profile.controller'
import { authenticate } from '../../middleware/auth.middleware'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

const router = Router()
const repo = new CoachProfileRepository()
const service = new CoachProfileService(repo)
const controller = new CoachProfileController(service)

router.get('/me', authenticate, controller.getMe)
router.patch('/me', authenticate, controller.updateMe)
router.post('/me/photo', authenticate, upload.single('photo'), controller.uploadPhoto)

export { router as coachProfileRoutes }
```

- [ ] **Step 3: Mount routes in app.ts**

In `apps/api/src/app.ts`, add:

```typescript
import { coachProfileRoutes } from './modules/coach-profile/coach-profile.routes'
```

And in the routes section:

```typescript
app.use('/api/v1/coach-profiles', coachProfileRoutes)
```

Full updated app.ts:

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
import { paymentRoutes } from './modules/payment/payment.routes'
import { coachProfileRoutes } from './modules/coach-profile/coach-profile.routes'
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
  app.use('/api/v1/payments', paymentRoutes)
  app.use('/api/v1/coach-profiles', coachProfileRoutes)

  app.use(notFoundMiddleware)
  app.use(errorMiddleware)

  return app
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/coach-profile/coach-profile.controller.ts apps/api/src/modules/coach-profile/coach-profile.routes.ts apps/api/src/app.ts
git commit -m "feat: add CoachProfileController, routes, and mount in app"
```

---

## Task 9: Integration tests

**Files:**

- Create: `apps/api/src/modules/coach-profile/coach-profile.integration.test.ts`

- [ ] **Step 1: Write integration tests**

Create `apps/api/src/modules/coach-profile/coach-profile.integration.test.ts`:

```typescript
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../../app'
import { User } from '../auth/auth.model'
import { CoachProfile } from './coach-profile.model'

jest.mock('../../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: jest.fn(
        (_opts: unknown, cb: (err: null, result: { secure_url: string }) => void) => {
          cb(null, { secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg' })
          return { end: jest.fn() }
        }
      ),
    },
  },
}))

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const app = createApp()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await User.deleteMany({})
  await CoachProfile.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await User.deleteMany({})
  await CoachProfile.deleteMany({})
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

describe('GET /api/v1/coach-profiles/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/coach-profiles/me')
    expect(res.status).toBe(401)
  })

  it('returns the profile created during registration', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app).get('/api/v1/coach-profiles/me').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.data.displayName).toBe('Coach Ron')
    expect(res.body.data.slug).toMatch(/^coach-ron-[a-z0-9]{4}$/)
    expect(res.body.data.isPublic).toBe(false)
  })
})

describe('PATCH /api/v1/coach-profiles/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).patch('/api/v1/coach-profiles/me').send({ displayName: 'New' })
    expect(res.status).toBe(401)
  })

  it('updates profile fields and returns the updated profile', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app)
      .patch('/api/v1/coach-profiles/me')
      .set('Cookie', cookie)
      .send({
        displayName: 'Coach Ron Updated',
        city: 'Makati',
        specializations: ['beginner', 'dinking'],
        sessionTypes: ['private'],
        isPublic: true,
      })
    expect(res.status).toBe(200)
    expect(res.body.data.displayName).toBe('Coach Ron Updated')
    expect(res.body.data.city).toBe('Makati')
    expect(res.body.data.specializations).toEqual(['beginner', 'dinking'])
    expect(res.body.data.isPublic).toBe(true)
  })

  it('returns 400 VALIDATION_ERROR for invalid specialization', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app)
      .patch('/api/v1/coach-profiles/me')
      .set('Cookie', cookie)
      .send({ specializations: ['invalid-spec'] })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/v1/coach-profiles/me/photo', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/v1/coach-profiles/me/photo')
    expect(res.status).toBe(401)
  })

  it('returns 400 when no file is uploaded', async () => {
    const cookie = await loginAndGetCookie()
    const res = await request(app).post('/api/v1/coach-profiles/me/photo').set('Cookie', cookie)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('NO_FILE')
  })

  it('uploads photo and returns the Cloudinary URL', async () => {
    const cookie = await loginAndGetCookie()
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    const res = await request(app)
      .post('/api/v1/coach-profiles/me/photo')
      .set('Cookie', cookie)
      .attach('photo', testImageBuffer, { filename: 'test.png', contentType: 'image/png' })
    expect(res.status).toBe(200)
    expect(res.body.data.photoUrl).toBe('https://res.cloudinary.com/test/image/upload/test.jpg')
  })
})
```

- [ ] **Step 2: Run integration tests**

```bash
cd apps/api && node_modules/.bin/jest --testPathPattern="coach-profile.integration" --no-coverage
```

Expected: 8 tests pass.

- [ ] **Step 3: Run full test suite to confirm nothing broken**

```bash
cd apps/api && node_modules/.bin/jest --no-coverage --runInBand
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/coach-profile/coach-profile.integration.test.ts
git commit -m "feat: add coach profile integration tests"
```

---

## Task 10: Frontend — sidebar, page, 4 form components

**Files:**

- Modify: `apps/web/src/components/dashboard/Sidebar.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/public-profile/page.tsx`
- Create: `apps/web/src/components/public-profile/IdentityForm.tsx`
- Create: `apps/web/src/components/public-profile/CoachingDetailsForm.tsx`
- Create: `apps/web/src/components/public-profile/RatesForm.tsx`
- Create: `apps/web/src/components/public-profile/ContactVisibilityForm.tsx`

Note: The Write tool is blocked by a security hook. Use `cat << 'EOF' > path` bash heredocs for ALL file creation in this task.

- [ ] **Step 1: Add Public Profile nav item to Sidebar**

In `apps/web/src/components/dashboard/Sidebar.tsx`, update the imports and NAV_ITEMS:

```typescript
import { LayoutDashboard, Users, CalendarDays, CreditCard, Globe, UserCircle } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/dashboard/students', label: 'Students', Icon: Users },
  { href: '/dashboard/sessions', label: 'Sessions', Icon: CalendarDays },
  { href: '/dashboard/payments', label: 'Payments', Icon: CreditCard },
  { href: '/dashboard/public-profile', label: 'Public Profile', Icon: Globe },
  { href: '/dashboard/profile', label: 'Profile', Icon: UserCircle },
]
```

- [ ] **Step 2: Create the page directory and page.tsx**

```bash
mkdir -p "apps/web/src/app/(dashboard)/dashboard/public-profile"
mkdir -p "apps/web/src/components/public-profile"
```

Create `apps/web/src/app/(dashboard)/dashboard/public-profile/page.tsx` using heredoc:

```typescript
import type { PublicCoachProfile } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { IdentityForm } from '@/components/public-profile/IdentityForm'
import { CoachingDetailsForm } from '@/components/public-profile/CoachingDetailsForm'
import { RatesForm } from '@/components/public-profile/RatesForm'
import { ContactVisibilityForm } from '@/components/public-profile/ContactVisibilityForm'

export default async function PublicProfilePage() {
  const profile = await serverApiFetch<PublicCoachProfile>('/api/v1/coach-profiles/me')

  if (!profile) {
    return <p className="text-text-secondary text-sm">Unable to load profile. Please try again.</p>
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="font-outfit text-3xl font-bold text-text-primary">Public Profile</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your public listing on PickleCoach</p>
        <div className="mt-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-secondary">
          Your public URL:{' '}
          <span className="font-medium text-accent">
            picklecoach.com/coaches/{profile.slug}
          </span>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Identity
        </h2>
        <IdentityForm profile={profile} />
      </div>

      <div className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Coaching Details
        </h2>
        <CoachingDetailsForm profile={profile} />
      </div>

      <div className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Rates
        </h2>
        <RatesForm profile={profile} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Contact & Visibility
        </h2>
        <ContactVisibilityForm profile={profile} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create IdentityForm.tsx**

Create `apps/web/src/components/public-profile/IdentityForm.tsx` using heredoc:

```typescript
'use client'

import { useRef, useState } from 'react'
import type { PublicCoachProfile } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const INPUT_CLS =
  'w-full rounded-lg border border-border bg-base px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'
const LABEL_CLS = 'block text-sm font-medium text-text-secondary'

export function IdentityForm({ profile }: { profile: PublicCoachProfile }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await fetch(`${API_URL}/api/v1/coach-profiles/me/photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Upload failed')
      setPhotoUrl(data.data.photoUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setPhotoLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement)?.value ?? ''
    try {
      await apiFetch('/api/v1/coach-profiles/me', {
        method: 'PATCH',
        body: {
          displayName: getValue('displayName') || undefined,
          bio: getValue('bio') || undefined,
          city: getValue('city') || undefined,
        },
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 flex-shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-2xl border border-border">
              👤
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">Profile photo</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoLoading}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {photoLoading ? 'Uploading…' : 'Choose file'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayName" className={LABEL_CLS}>Display name</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={profile.displayName}
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className={LABEL_CLS}>Bio</label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile.bio ?? ''}
          placeholder="Tell students about your coaching style…"
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="city" className={LABEL_CLS}>City</label>
        <input
          id="city"
          name="city"
          type="text"
          defaultValue={profile.city ?? ''}
          placeholder="e.g. Makati, Metro Manila"
          className={INPUT_CLS}
        />
      </div>

      {error && <p className="text-error text-sm">{error}</p>}
      {success && <p className="text-success text-sm">Changes saved.</p>}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-base disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Create CoachingDetailsForm.tsx**

Create `apps/web/src/components/public-profile/CoachingDetailsForm.tsx` using heredoc:

```typescript
'use client'

import { useState } from 'react'
import type { PublicCoachProfile } from '@picklecoach/shared'
import { SPECIALIZATIONS } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const SPEC_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  dinking: 'Dinking',
  serve: 'Serve',
  '3rd-shot-drop': '3rd Shot Drop',
  footwork: 'Footwork',
  strategy: 'Strategy',
  doubles: 'Doubles',
  singles: 'Singles',
}

export function CoachingDetailsForm({ profile }: { profile: PublicCoachProfile }) {
  const [specs, setSpecs] = useState<string[]>(profile.specializations)
  const [types, setTypes] = useState<string[]>(profile.sessionTypes)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function toggleSpec(value: string) {
    setSpecs((prev) => prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value])
  }

  function toggleType(value: string) {
    setTypes((prev) => prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      await apiFetch('/api/v1/coach-profiles/me', {
        method: 'PATCH',
        body: { specializations: specs, sessionTypes: types },
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-secondary">Specializations</span>
        <div className="flex flex-wrap gap-2">
          {[...SPECIALIZATIONS].map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => toggleSpec(spec)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                specs.includes(spec)
                  ? 'bg-accent text-base'
                  : 'bg-surface border border-border text-text-secondary hover:border-accent'
              }`}
            >
              {SPEC_LABELS[spec]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-secondary">Session types offered</span>
        <div className="flex gap-2">
          {(['private', 'group'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                types.includes(type)
                  ? 'bg-accent text-base'
                  : 'bg-surface border border-border text-text-secondary hover:border-accent'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}
      {success && <p className="text-success text-sm">Changes saved.</p>}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-base disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 5: Create RatesForm.tsx**

Create `apps/web/src/components/public-profile/RatesForm.tsx` using heredoc:

```typescript
'use client'

import { useState } from 'react'
import type { PublicCoachProfile } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-base px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'
const LABEL_CLS = 'block text-sm font-medium text-text-secondary'

export function RatesForm({ profile }: { profile: PublicCoachProfile }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement)?.value ?? ''
    const privateRateStr = getValue('privateRate')
    const groupRateStr = getValue('groupRate')
    try {
      await apiFetch('/api/v1/coach-profiles/me', {
        method: 'PATCH',
        body: {
          privateRate: privateRateStr ? Number(privateRateStr) : undefined,
          groupRate: groupRateStr ? Number(groupRateStr) : undefined,
          ratesNote: getValue('ratesNote') || undefined,
        },
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="privateRate" className={LABEL_CLS}>Private rate (PHP)</label>
          <input
            id="privateRate"
            name="privateRate"
            type="number"
            min={0}
            defaultValue={profile.privateRate ?? ''}
            placeholder="e.g. 1500"
            className={INPUT_CLS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="groupRate" className={LABEL_CLS}>Group rate (PHP)</label>
          <input
            id="groupRate"
            name="groupRate"
            type="number"
            min={0}
            defaultValue={profile.groupRate ?? ''}
            placeholder="e.g. 800"
            className={INPUT_CLS}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ratesNote" className={LABEL_CLS}>
          Rates note <span className="text-muted text-xs">(optional)</span>
        </label>
        <input
          id="ratesNote"
          name="ratesNote"
          type="text"
          defaultValue={profile.ratesNote ?? ''}
          placeholder="e.g. packages available"
          className={INPUT_CLS}
        />
      </div>

      {error && <p className="text-error text-sm">{error}</p>}
      {success && <p className="text-success text-sm">Changes saved.</p>}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-base disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 6: Create ContactVisibilityForm.tsx**

Create `apps/web/src/components/public-profile/ContactVisibilityForm.tsx` using heredoc:

```typescript
'use client'

import { useState } from 'react'
import type { PublicCoachProfile } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-base px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'
const LABEL_CLS = 'block text-sm font-medium text-text-secondary'

export function ContactVisibilityForm({ profile }: { profile: PublicCoachProfile }) {
  const [showContact, setShowContact] = useState(profile.showContactInfo)
  const [isPublic, setIsPublic] = useState(profile.isPublic)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement)?.value ?? ''
    try {
      await apiFetch('/api/v1/coach-profiles/me', {
        method: 'PATCH',
        body: {
          contactEmail: getValue('contactEmail') || undefined,
          contactPhone: getValue('contactPhone') || undefined,
          showContactInfo: showContact,
          isPublic,
        },
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contactEmail" className={LABEL_CLS}>
          Contact email <span className="text-muted text-xs">(optional)</span>
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          defaultValue={profile.contactEmail ?? ''}
          placeholder="Shown on profile if enabled"
          className={INPUT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contactPhone" className={LABEL_CLS}>
          Contact phone <span className="text-muted text-xs">(optional)</span>
        </label>
        <input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          defaultValue={profile.contactPhone ?? ''}
          placeholder="Shown on profile if enabled"
          className={INPUT_CLS}
        />
      </div>

      <div
        role="button"
        onClick={() => setShowContact((v) => !v)}
        className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-base px-4 py-3"
      >
        <div>
          <p className="text-sm font-medium text-text-primary">Show contact info publicly</p>
          <p className="text-xs text-muted">Display email/phone on your profile page</p>
        </div>
        <div
          className={`relative h-5 w-9 rounded-full transition-colors ${showContact ? 'bg-accent' : 'bg-border'}`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showContact ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </div>
      </div>

      <div
        role="button"
        onClick={() => setIsPublic((v) => !v)}
        className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-base px-4 py-3"
      >
        <div>
          <p className="text-sm font-medium text-text-primary">List me in the coach directory</p>
          <p className="text-xs text-muted">Makes your profile discoverable at /coaches</p>
        </div>
        <div
          className={`relative h-5 w-9 rounded-full transition-colors ${isPublic ? 'bg-accent' : 'bg-border'}`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </div>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}
      {success && <p className="text-success text-sm">Changes saved.</p>}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-base disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 7: Commit all frontend files**

```bash
git add apps/web/src/components/dashboard/Sidebar.tsx \
        "apps/web/src/app/(dashboard)/dashboard/public-profile/page.tsx" \
        apps/web/src/components/public-profile/
git commit -m "feat: add Public Profile dashboard page with 4 form cards"
```

---

## Task 11: Browser verification

- [ ] **Step 1: Restart API server to pick up new routes**

Kill the running server (if using non-watch mode) and restart:

```bash
# Find and kill existing process
lsof -ti :4000 | xargs kill -9 2>/dev/null || true
# Start fresh in background
cd apps/api && node_modules/.bin/tsx src/server.ts &
sleep 2
curl -s http://localhost:4000/health
```

Expected: `{"success":true,"data":{"status":"ok"}}`

- [ ] **Step 2: Verify the page renders**

Navigate to `http://localhost:3000/dashboard/public-profile` in the browser. Confirm:

- Page loads with the 4 cards
- Slug URL is shown at the top
- Name is pre-filled in Identity card

- [ ] **Step 3: Test Identity card save**

Update display name, click Save. Confirm success toast appears.

- [ ] **Step 4: Test Coaching Details card**

Click specialization pills to select/deselect. Click Save. Confirm success toast.

- [ ] **Step 5: Test Rates card**

Enter private and group rates. Click Save. Confirm success toast.

- [ ] **Step 6: Test Contact & Visibility card**

Toggle "List me in the coach directory" to on. Click Save. Confirm success toast.

- [ ] **Step 7: Run full test suite one last time**

```bash
cd apps/api && node_modules/.bin/jest --no-coverage --runInBand
```

Expected: all tests pass.

- [ ] **Step 8: Commit any fixes found during browser testing**

```bash
git add -A
git commit -m "fix: browser verification fixes for public profile setup"
```

(Only commit if there are actual fixes. Skip if no changes.)
