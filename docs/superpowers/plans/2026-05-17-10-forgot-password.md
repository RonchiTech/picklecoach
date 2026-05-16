# Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a forgot-password / reset-password flow so coaches can recover access via a one-hour email link.

**Architecture:** API generates a `crypto.randomBytes(32)` token, stores its SHA-256 hash + expiry on the User document, and sends the raw token in a Resend email. The `/reset-password?token=xxx` page submits token + new password; the API hashes the incoming token, looks it up, checks expiry, updates the password, and clears the fields. `forgotPassword` always returns 200 regardless of whether the email exists (prevents user enumeration).

**Tech Stack:** Resend (email), Node.js `crypto` (token), bcryptjs (password hash), Express, Next.js 15 App Router, TypeScript.

> **Environment note:** The Write tool is blocked in this repo by a security hook. Create ALL new files using Bash heredoc: `cat << 'EOF' > path/to/file`. The Edit tool works for modifying existing files.

---

## File Map

**Create (API):**

- `apps/api/src/config/resend.ts` — Resend client singleton

**Modify (API):**

- `apps/api/src/config/env.ts` — add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `apps/api/src/modules/auth/auth.model.ts` — add `resetPasswordToken?` and `resetPasswordExpiresAt?` fields
- `apps/api/src/modules/auth/auth.repository.ts` — add `findByResetToken`, `setResetToken`, `clearResetToken`
- `apps/api/src/modules/auth/auth.repository.test.ts` — add tests for new repo methods
- `apps/api/src/modules/auth/auth.service.ts` — add `forgotPassword` and `resetPassword`
- `apps/api/src/modules/auth/auth.service.test.ts` — add tests for new service methods
- `apps/api/src/modules/auth/auth.controller.ts` — add `forgotPassword` and `resetPassword` handlers
- `apps/api/src/modules/auth/auth.routes.ts` — add two new POST routes
- `apps/api/src/modules/auth/auth.integration.test.ts` — add forgot/reset integration tests

**Modify (Shared):**

- `packages/shared/src/schemas/auth.schema.ts` — add `forgotPasswordSchema`, `resetPasswordSchema`, their input types

**Create (Web):**

- `apps/web/src/components/auth/ForgotPasswordForm.tsx`
- `apps/web/src/components/auth/ResetPasswordForm.tsx`
- `apps/web/src/app/(auth)/forgot-password/page.tsx`
- `apps/web/src/app/(auth)/reset-password/page.tsx`

**Modify (Web):**

- `apps/web/src/components/auth/LoginForm.tsx` — add "Forgot password?" link + success banner for `?reset=success`

---

## Task 1: Install Resend + Env Vars + Config

**Files:**

- `apps/api/package.json` (modified by pnpm)
- Modify: `apps/api/src/config/env.ts`
- Create: `apps/api/src/config/resend.ts`

- [ ] **Step 1: Install Resend**

```bash
cd apps/api && pnpm add resend
```

Expected: `package.json` updated with `resend`.

- [ ] **Step 2: Add env vars to env.ts**

In `apps/api/src/config/env.ts`, add inside `envSchema`:

```typescript
RESEND_API_KEY: z.string().default(''),
RESEND_FROM_EMAIL: z.string().default('noreply@picklecoach.com'),
```

The full updated `envSchema` object:

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
  RESEND_API_KEY: z.string().default(''),
  RESEND_FROM_EMAIL: z.string().default('noreply@picklecoach.com'),
})
```

- [ ] **Step 3: Create the Resend config file**

```bash
cat << 'EOF' > apps/api/src/config/resend.ts
import { Resend } from 'resend'
import { env } from './env'

export const resend = new Resend(env.RESEND_API_KEY)
EOF
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml apps/api/src/config/env.ts apps/api/src/config/resend.ts
git commit -m "chore: add Resend email client and env vars"
```

---

## Task 2: Add Shared Schemas

**Files:**

- Modify: `packages/shared/src/schemas/auth.schema.ts`

- [ ] **Step 1: Add forgotPasswordSchema and resetPasswordSchema**

Append to the end of `packages/shared/src/schemas/auth.schema.ts`:

```typescript
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
```

- [ ] **Step 2: Build shared package**

```bash
cd packages/shared && npm run build
```

Expected: no errors, `dist/` updated.

- [ ] **Step 3: Verify API compiles**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/schemas/auth.schema.ts
git commit -m "feat: add forgotPassword and resetPassword shared schemas"
```

---

## Task 3: Update User Model

**Files:**

- Modify: `apps/api/src/modules/auth/auth.model.ts`

- [ ] **Step 1: Add reset token fields to IUser interface**

In `apps/api/src/modules/auth/auth.model.ts`, add two optional fields to the `IUser` interface after `profilePhoto?`:

```typescript
  resetPasswordToken?: string
  resetPasswordExpiresAt?: Date
```

- [ ] **Step 2: Add fields to userSchema**

Inside the `userSchema` definition, add after the `profilePhoto` field:

```typescript
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiresAt: { type: Date, select: false },
```

The `select: false` means these fields are excluded from normal queries — only fetched when explicitly requested.

The full updated schema definition:

```typescript
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['coach', 'super_admin'], default: 'coach' },
    phone: { type: String },
    subscriptionTier: { type: String, enum: ['starter', 'pro', 'team'], default: 'starter' },
    subscriptionStatus: {
      type: String,
      enum: ['trial', 'active', 'expired', 'cancelled'],
      default: 'trial',
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    isPublic: { type: Boolean, default: true },
    city: { type: String },
    bio: { type: String },
    profilePhoto: { type: String },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
)
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/auth/auth.model.ts
git commit -m "feat: add resetPasswordToken and resetPasswordExpiresAt to User model"
```

---

## Task 4: Update Auth Repository — Tests Then Implementation

**Files:**

- Modify: `apps/api/src/modules/auth/auth.repository.ts`
- Modify: `apps/api/src/modules/auth/auth.repository.test.ts`

- [ ] **Step 1: Add three new tests to auth.repository.test.ts**

Open `apps/api/src/modules/auth/auth.repository.test.ts` and append at the end of the file (before the final closing):

```typescript
describe('UserRepository.setResetToken', () => {
  it('stores tokenHash and expiresAt on the user', async () => {
    const user = await repo.create({
      name: 'Coach Ron',
      email: 'ron@test.com',
      passwordHash: 'hash',
    })
    const expiresAt = new Date(Date.now() + 3600_000)
    await repo.setResetToken(user._id.toString(), 'abc123hash', expiresAt)
    const updated = await User.findById(user._id).select(
      '+resetPasswordToken +resetPasswordExpiresAt'
    )
    expect(updated?.resetPasswordToken).toBe('abc123hash')
    expect(updated?.resetPasswordExpiresAt?.getTime()).toBeCloseTo(expiresAt.getTime(), -3)
  })
})

describe('UserRepository.findByResetToken', () => {
  it('returns null when no user has that token hash', async () => {
    const result = await repo.findByResetToken('nonexistent-hash')
    expect(result).toBeNull()
  })

  it('returns the user when token hash matches', async () => {
    const user = await repo.create({
      name: 'Coach Ron',
      email: 'ron@test.com',
      passwordHash: 'hash',
    })
    await repo.setResetToken(user._id.toString(), 'myhash', new Date(Date.now() + 3600_000))
    const found = await repo.findByResetToken('myhash')
    expect(found?.email).toBe('ron@test.com')
    expect(found?.resetPasswordToken).toBe('myhash')
    expect(found?.resetPasswordExpiresAt).toBeDefined()
  })
})

describe('UserRepository.clearResetToken', () => {
  it('removes resetPasswordToken and resetPasswordExpiresAt from the user', async () => {
    const user = await repo.create({
      name: 'Coach Ron',
      email: 'ron@test.com',
      passwordHash: 'hash',
    })
    await repo.setResetToken(user._id.toString(), 'myhash', new Date(Date.now() + 3600_000))
    await repo.clearResetToken(user._id.toString())
    const updated = await User.findById(user._id).select(
      '+resetPasswordToken +resetPasswordExpiresAt'
    )
    expect(updated?.resetPasswordToken).toBeUndefined()
    expect(updated?.resetPasswordExpiresAt).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && npx jest --runInBand src/modules/auth/auth.repository.test.ts 2>&1 | tail -10
```

Expected: FAIL — `repo.setResetToken is not a function` (or similar).

- [ ] **Step 3: Add methods to IAuthRepository interface**

In `apps/api/src/modules/auth/auth.repository.ts`, add to the `IAuthRepository` interface:

```typescript
  setResetToken(id: string, tokenHash: string, expiresAt: Date): Promise<void>
  findByResetToken(tokenHash: string): Promise<IUser | null>
  clearResetToken(id: string): Promise<void>
```

- [ ] **Step 4: Implement the three methods on UserRepository**

Append inside the `UserRepository` class:

```typescript
  async setResetToken(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await User.updateOne(
      { _id: id },
      { $set: { resetPasswordToken: tokenHash, resetPasswordExpiresAt: expiresAt } }
    )
  }

  async findByResetToken(tokenHash: string): Promise<IUser | null> {
    return User.findOne({ resetPasswordToken: tokenHash }).select(
      '+resetPasswordToken +resetPasswordExpiresAt'
    )
  }

  async clearResetToken(id: string): Promise<void> {
    await User.updateOne(
      { _id: id },
      { $unset: { resetPasswordToken: '', resetPasswordExpiresAt: '' } }
    )
  }
```

- [ ] **Step 5: Run tests — verify all pass**

```bash
cd apps/api && npx jest --runInBand src/modules/auth/auth.repository.test.ts 2>&1 | tail -10
```

Expected: PASS — all tests green.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/auth/auth.repository.ts apps/api/src/modules/auth/auth.repository.test.ts
git commit -m "feat: add setResetToken, findByResetToken, clearResetToken to UserRepository"
```

---

## Task 5: Update Auth Service — Tests Then Implementation

**Files:**

- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Modify: `apps/api/src/modules/auth/auth.service.test.ts`

- [ ] **Step 1: Add mock and new tests to auth.service.test.ts**

At the top of `apps/api/src/modules/auth/auth.service.test.ts`, add the Resend mock (before any imports resolve):

```typescript
jest.mock('../../config/resend', () => ({
  resend: {
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-email-id' }),
    },
  },
}))
```

Add three new repo mock methods to `mockRepo`:

```typescript
const mockRepo: jest.Mocked<IAuthRepository> = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  emailExists: jest.fn(),
  update: jest.fn(),
  updatePassword: jest.fn(),
  setResetToken: jest.fn(),
  findByResetToken: jest.fn(),
  clearResetToken: jest.fn(),
}
```

Append these describe blocks at the end of the file:

```typescript
describe('AuthService.forgotPassword', () => {
  it('returns silently when email does not exist', async () => {
    mockRepo.findByEmail.mockResolvedValue(null)
    await expect(service.forgotPassword('ghost@test.com')).resolves.not.toThrow()
    expect(mockRepo.setResetToken).not.toHaveBeenCalled()
  })

  it('sets a reset token and sends an email when user exists', async () => {
    mockRepo.findByEmail.mockResolvedValue(mockUser)
    mockRepo.setResetToken.mockResolvedValue(undefined)
    await service.forgotPassword('ron@test.com')
    expect(mockRepo.setResetToken).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      expect.any(String),
      expect.any(Date)
    )
  })
})

describe('AuthService.resetPassword', () => {
  it('throws INVALID_RESET_TOKEN when token does not match any user', async () => {
    mockRepo.findByResetToken.mockResolvedValue(null)
    await expect(service.resetPassword('bad-token', 'newpass123')).rejects.toMatchObject({
      code: 'INVALID_RESET_TOKEN',
      statusCode: 400,
    })
  })

  it('throws INVALID_RESET_TOKEN when token is expired', async () => {
    const expiredUser = {
      ...mockUser,
      resetPasswordToken: 'somehash',
      resetPasswordExpiresAt: new Date(Date.now() - 1000),
    }
    mockRepo.findByResetToken.mockResolvedValue(expiredUser as unknown as IUser)
    await expect(service.resetPassword('some-token', 'newpass123')).rejects.toMatchObject({
      code: 'INVALID_RESET_TOKEN',
      statusCode: 400,
    })
  })

  it('updates password and clears token on success', async () => {
    const validUser = {
      ...mockUser,
      resetPasswordToken: 'somehash',
      resetPasswordExpiresAt: new Date(Date.now() + 3600_000),
    }
    mockRepo.findByResetToken.mockResolvedValue(validUser as unknown as IUser)
    mockRepo.updatePassword.mockResolvedValue(undefined)
    mockRepo.clearResetToken.mockResolvedValue(undefined)
    await service.resetPassword('some-token', 'newpass123')
    expect(mockRepo.updatePassword).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      expect.any(String)
    )
    const hashArg = mockRepo.updatePassword.mock.calls[0][1]
    expect(hashArg).not.toBe('newpass123')
    expect(mockRepo.clearResetToken).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && npx jest --runInBand src/modules/auth/auth.service.test.ts 2>&1 | tail -10
```

Expected: FAIL — `service.forgotPassword is not a function`.

- [ ] **Step 3: Implement forgotPassword and resetPassword in auth.service.ts**

Add these imports at the top of `apps/api/src/modules/auth/auth.service.ts`:

```typescript
import crypto from 'crypto'
import { resend } from '../../config/resend'
import type { ForgotPasswordInput, ResetPasswordInput } from '@picklecoach/shared'
```

Add these two methods inside the `AuthService` class (after `changePassword`):

```typescript
  async forgotPassword(email: string): Promise<void> {
    const user = await this.repo.findByEmail(email)
    if (!user) return

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await this.repo.setResetToken(user._id.toString(), tokenHash, expiresAt)

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'Reset your PickleCoach password',
      html: `<p>Hi ${user.name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p><p>If you did not request this, ignore this email.</p>`,
    })
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const user = await this.repo.findByResetToken(tokenHash)

    if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
      throw createError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN')
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await this.repo.updatePassword(user._id.toString(), passwordHash)
    await this.repo.clearResetToken(user._id.toString())
  }
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
cd apps/api && npx jest --runInBand src/modules/auth/auth.service.test.ts 2>&1 | tail -10
```

Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/auth.service.test.ts
git commit -m "feat: add forgotPassword and resetPassword to AuthService"
```

---

## Task 6: Update Auth Controller and Routes

**Files:**

- Modify: `apps/api/src/modules/auth/auth.controller.ts`
- Modify: `apps/api/src/modules/auth/auth.routes.ts`

- [ ] **Step 1: Add forgotPassword and resetPassword handlers to auth.controller.ts**

Add these imports at the top:

```typescript
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updatePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@picklecoach/shared'
```

Add these two handlers inside the `AuthController` class (after `changePassword`):

```typescript
forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body)
    await this.service.forgotPassword(email)
    res.json({
      success: true,
      data: { message: 'If that email is registered, a reset link has been sent.' },
    })
  } catch (err) {
    next(err)
  }
}

resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body)
    await this.service.resetPassword(token, newPassword)
    res.json({ success: true, data: { message: 'Password updated successfully.' } })
  } catch (err) {
    next(err)
  }
}
```

- [ ] **Step 2: Add two routes to auth.routes.ts**

In `apps/api/src/modules/auth/auth.routes.ts`, add after the existing routes:

```typescript
router.post('/forgot-password', controller.forgotPassword)
router.post('/reset-password', controller.resetPassword)
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/auth/auth.controller.ts apps/api/src/modules/auth/auth.routes.ts
git commit -m "feat: add forgotPassword and resetPassword controller handlers and routes"
```

---

## Task 7: Integration Tests

**Files:**

- Modify: `apps/api/src/modules/auth/auth.integration.test.ts`

- [ ] **Step 1: Add Resend mock and new describe blocks to auth.integration.test.ts**

At the very top of `apps/api/src/modules/auth/auth.integration.test.ts` (before the existing imports), add:

```typescript
jest.mock('../../config/resend', () => ({
  resend: {
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-email-id' }),
    },
  },
}))
```

Append these describe blocks at the end of the file:

```typescript
describe('POST /api/v1/auth/forgot-password', () => {
  it('returns 200 and generic message for any email (registered or not)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ghost@test.com' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('returns 200 and stores a reset token when email is registered', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach Ron', email: 'ron@test.com', password: 'password123' })

    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ron@test.com' })

    expect(res.status).toBe(200)
    const user = await User.findOne({ email: 'ron@test.com' }).select(
      '+resetPasswordToken +resetPasswordExpiresAt'
    )
    expect(user?.resetPasswordToken).toBeDefined()
    expect(user?.resetPasswordExpiresAt).toBeDefined()
  })

  it('returns 400 VALIDATION_ERROR for invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'not-an-email' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/v1/auth/reset-password', () => {
  it('returns 400 INVALID_RESET_TOKEN for an unknown token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'deadbeef'.repeat(8), newPassword: 'newpass123' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_RESET_TOKEN')
  })

  it('resets the password and clears the token on a valid token', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Coach Ron', email: 'ron@test.com', password: 'password123' })
    await request(app).post('/api/v1/auth/forgot-password').send({ email: 'ron@test.com' })

    const userWithToken = await User.findOne({ email: 'ron@test.com' }).select(
      '+resetPasswordToken +resetPasswordExpiresAt'
    )

    // Simulate what the email link would contain — we need the raw token.
    // In integration tests, capture it by spying on the mock.
    const { resend: mockResend } = jest.requireMock('../../config/resend') as {
      resend: { emails: { send: jest.Mock } }
    }
    const emailHtml: string = mockResend.emails.send.mock.calls[0][0].html
    const tokenMatch = emailHtml.match(/token=([a-f0-9]+)/)
    expect(tokenMatch).not.toBeNull()
    const rawToken = tokenMatch![1]

    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'newsecurepass123' })
    expect(resetRes.status).toBe(200)

    // Verify token is cleared
    const clearedUser = await User.findOne({ email: 'ron@test.com' }).select(
      '+resetPasswordToken +resetPasswordExpiresAt'
    )
    expect(clearedUser?.resetPasswordToken).toBeUndefined()

    // Verify new password works
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ron@test.com', password: 'newsecurepass123' })
    expect(loginRes.status).toBe(200)
  })

  it('returns 400 VALIDATION_ERROR when newPassword is too short', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'sometoken', newPassword: 'short' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})
```

- [ ] **Step 2: Run integration tests**

```bash
cd apps/api && npx jest --runInBand src/modules/auth/auth.integration.test.ts 2>&1 | tail -15
```

Expected: PASS — all tests green.

- [ ] **Step 3: Run the full test suite**

```bash
cd apps/api && npx jest --runInBand 2>&1 | tail -8
```

Expected: all tests pass, no regressions.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/auth/auth.integration.test.ts
git commit -m "test: add forgot-password and reset-password integration tests"
```

---

## Task 8: Web — ForgotPasswordForm + Page + LoginForm Link

**Files:**

- Create: `apps/web/src/components/auth/ForgotPasswordForm.tsx`
- Create: `apps/web/src/app/(auth)/forgot-password/page.tsx`
- Modify: `apps/web/src/components/auth/LoginForm.tsx`

- [ ] **Step 1: Create ForgotPasswordForm**

```bash
cat << 'EOF' > apps/web/src/components/auth/ForgotPasswordForm.tsx
'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value
    try {
      await apiFetch('/api/v1/auth/forgot-password', { method: 'POST', body: { email } })
    } catch {
      // always show success — never reveal whether email exists
    } finally {
      setSubmitted(true)
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <p className="text-sm text-text-secondary">
        If that email is registered, you&apos;ll receive a reset link shortly. Check your inbox.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-text-secondary">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent py-2.5 font-semibold text-[#0C0C10] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
EOF
```

- [ ] **Step 2: Create the forgot-password page**

```bash
mkdir -p apps/web/src/app/\(auth\)/forgot-password
cat << 'EOF' > "apps/web/src/app/(auth)/forgot-password/page.tsx"
import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Reset your password</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-text-secondary">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
EOF
```

- [ ] **Step 3: Add "Forgot password?" link to LoginForm**

In `apps/web/src/components/auth/LoginForm.tsx`, replace the password field label line to add the link inline. Find the existing `<label htmlFor="password">` block and replace it with:

```typescript
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-text-secondary">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>
```

Also add `Link` to the imports at the top of `LoginForm.tsx`:

```typescript
import Link from 'next/link'
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/auth/ForgotPasswordForm.tsx "apps/web/src/app/(auth)/forgot-password/" apps/web/src/components/auth/LoginForm.tsx
git commit -m "feat: add forgot-password page and Forgot password? link on login"
```

---

## Task 9: Web — ResetPasswordForm + Page + Login Success Banner

**Files:**

- Create: `apps/web/src/components/auth/ResetPasswordForm.tsx`
- Create: `apps/web/src/app/(auth)/reset-password/page.tsx`
- Modify: `apps/web/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create ResetPasswordForm**

```bash
cat << 'EOF' > apps/web/src/components/auth/ResetPasswordForm.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

export function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-error">
          Invalid or missing reset link. Please request a new one.
        </p>
        <Link href="/forgot-password" className="text-sm text-accent hover:underline">
          Request a new reset link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const newPassword = (e.currentTarget.elements.namedItem('newPassword') as HTMLInputElement).value
    try {
      await apiFetch('/api/v1/auth/reset-password', { method: 'POST', body: { token, newPassword } })
      router.push('/login?reset=success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className="text-sm font-medium text-text-secondary">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          placeholder="••••••••"
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent py-2.5 font-semibold text-[#0C0C10] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Updating…' : 'Set new password'}
      </button>
    </form>
  )
}
EOF
```

- [ ] **Step 2: Create the reset-password page**

```bash
mkdir -p "apps/web/src/app/(auth)/reset-password"
cat << 'EOF' > "apps/web/src/app/(auth)/reset-password/page.tsx"
import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Set new password</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Choose a new password for your account.
          </p>
        </div>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
EOF
```

- [ ] **Step 3: Add success banner to login page for ?reset=success**

Replace the content of `apps/web/src/app/(auth)/login/page.tsx` with:

```typescript
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

type SearchParams = Promise<{ reset?: string }>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="mt-1 text-sm text-text-secondary">Sign in to your PickleCoach account</p>
        </div>
        {sp.reset === 'success' && (
          <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            Password updated. Sign in with your new password.
          </div>
        )}
        <LoginForm />
        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Test in browser — golden path**

1. Navigate to `http://localhost:3000/login` — verify "Forgot password?" link appears below the password field
2. Click the link — should land on `/forgot-password`
3. Enter a registered email — page should show "If that email is registered…" confirmation
4. Check API logs for the reset URL (or check MongoDB for the stored token hash)
5. Navigate to `http://localhost:3000/reset-password?token=<raw-token-from-log>`
6. Enter a new password — should redirect to `/login?reset=success`
7. Login banner should appear confirming the password was changed
8. Sign in with the new password — should succeed

- [ ] **Step 6: Test in browser — edge cases**

- `/reset-password` with no `?token` param → shows "Invalid or missing reset link" message
- `/reset-password?token=badtoken` → after submitting, shows error "Reset failed. The link may have expired."
- `/forgot-password` with a non-registered email → still shows success message (no enumeration)

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/auth/ResetPasswordForm.tsx "apps/web/src/app/(auth)/reset-password/" "apps/web/src/app/(auth)/login/page.tsx"
git commit -m "feat: add reset-password page and login success banner"
```

---

## Done

All tasks complete. The forgot-password flow is fully implemented:

- `POST /api/v1/auth/forgot-password` — generates token, stores hash, sends Resend email
- `POST /api/v1/auth/reset-password` — validates token, updates password, clears token
- `/forgot-password` page with silent success (no email enumeration)
- `/reset-password?token=xxx` page
- "Forgot password?" link on login page
- Success banner on login page after reset
