# Profile Module Design Spec

## 1. Goal

Allow coaches to update their name and phone number, and change their password from a dedicated profile page. Password change requires the current password for confirmation and submits independently from the account info form.

## 2. Architecture

Extends the existing `auth` module — no new module, no new MongoDB collection. Two new authenticated routes, two new service methods, two new repository methods. The `GET /api/v1/auth/me` response is extended to include `phone` so the profile page can pre-fill the form without an extra fetch.

```
shared package  →  updateProfileSchema, updatePasswordSchema, PublicUser (+ phone)
API (auth)      →  repository.update + updatePassword → service.updateProfile + changePassword → controller → routes
Web             →  server-component page → ProfileForm + PasswordForm (client components)
```

## 3. Shared Package

### Zod schemas (`packages/shared/src/schemas/auth.schema.ts`)

Two new schemas appended to the existing file:

```ts
updateProfileSchema: {
  name?: string (min 1)
  phone?: string
}

updatePasswordSchema: {
  currentPassword: string (min 1)
  newPassword: string (min 8, 'Password must be at least 8 characters')
}
```

Exported types: `UpdateProfileInput`, `UpdatePasswordInput`

### Types (`packages/shared/src/types/index.ts`)

`PublicUser` interface updated to include:

```ts
export interface PublicUser {
  _id: string
  name: string
  email: string
  phone?: string // added
  role: UserRole
  subscriptionTier: SubscriptionTier
  subscriptionStatus: SubscriptionStatus
}
```

## 4. API

All new routes require the `authenticate` middleware. Mounted under the existing `/api/v1/auth` router.

| Method | Path      | Description                        |
| ------ | --------- | ---------------------------------- |
| GET    | /me       | Already exists — now returns phone |
| PATCH  | /profile  | Update name and/or phone           |
| PATCH  | /password | Change password (requires current) |

### Repository (`auth.repository.ts`)

Two new methods added to `IAuthRepository` and `UserRepository`:

```ts
update(id: string, data: { name?: string; phone?: string }): Promise<IUser | null>
updatePassword(id: string, passwordHash: string): Promise<void>
```

`update` uses `findByIdAndUpdate` with `{ new: true }`.
`updatePassword` uses `updateOne({ _id: id }, { $set: { passwordHash } })`.

### Service (`auth.service.ts`)

Two new methods on `AuthService`:

```ts
async updateProfile(id: string, input: UpdateProfileInput): Promise<PublicUser>
// Calls repo.update, throws USER_NOT_FOUND 404 if null, returns sanitize(user)

async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void>
// 1. repo.findById → throws USER_NOT_FOUND 404 if not found
// 2. user.comparePassword(currentPassword) → throws INVALID_CURRENT_PASSWORD 401 if false
// 3. bcrypt.hash(newPassword, 12) → repo.updatePassword(id, hash)
```

`sanitize()` updated to include `phone` in the returned `PublicUser`.

### Controller (`auth.controller.ts`)

Two new handler methods:

```ts
updateProfile = async (req, res, next) => {
  // parse updateProfileSchema, call service.updateProfile(req.user!.userId, input)
  // res.json({ success: true, data: user })
}

changePassword = async (req, res, next) => {
  // parse updatePasswordSchema, call service.changePassword(req.user!.userId, input.currentPassword, input.newPassword)
  // res.json({ success: true, data: null })
}
```

## 5. Web UI

### Page (`/dashboard/profile`)

File: `apps/web/src/app/(dashboard)/dashboard/profile/page.tsx`

Server component. Fetches `GET /api/v1/auth/me` via `serverApiFetch`, passes user to both client components.

### `ProfileForm` (client component)

File: `apps/web/src/components/profile/ProfileForm.tsx`

- Fields: Name (required), Phone (optional)
- Pre-filled from `user` prop
- On submit: `PATCH /api/v1/auth/profile`
- On success: shows inline green "Saved" message that clears after 3 seconds

### `PasswordForm` (client component)

File: `apps/web/src/components/profile/PasswordForm.tsx`

- Fields: Current password, New password, Confirm new password
- Never pre-filled — always blank
- Client-side validation: new password and confirm must match before submitting
- On submit: `PATCH /api/v1/auth/password`
- On success: clears all three fields, shows inline green "Password updated" message
- On `INVALID_CURRENT_PASSWORD` error: shows inline "Current password is incorrect"

## 6. Testing

Three-layer TDD (red → green → commit):

### `auth.repository.test.ts` (additions)

- `update`: updates name and phone, returns updated user
- `updatePassword`: updates the passwordHash field

### `auth.service.test.ts` (additions)

- `updateProfile`: calls repo.update, returns sanitized user with phone
- `changePassword` — wrong current password: throws INVALID_CURRENT_PASSWORD 401
- `changePassword` — correct current password: calls repo.updatePassword with new hash

### `auth.integration.test.ts` (new file)

- `PATCH /api/v1/auth/profile` — 401 without token
- `PATCH /api/v1/auth/profile` — updates name and phone, reflects in subsequent GET /me
- `PATCH /api/v1/auth/password` — 401 with wrong current password
- `PATCH /api/v1/auth/password` — 200 with correct current, new password works for login

## 7. Out of Scope

- Email change (requires verification flow)
- Avatar / profile photo upload (requires file storage — public profile plan)
- Forgot password / password reset via email (separate feature)
- Public profile fields: bio, city, specializations, rates (public profile plan)
