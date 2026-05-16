# Public Profile Setup — Design Spec

**Date:** 2026-05-17
**Status:** Approved

---

## 1. Overview

Coaches can opt in to a public listing on PickleCoach. This module covers the **dashboard setup side** — the form where a coach configures their public presence (bio, photo, specializations, rates, contact preferences, and visibility toggle). The public-facing directory and coach profile pages are a separate plan.

**Goal:** Every registered coach has a profile record. They fill it out at their own pace and flip `isPublic` when ready.

---

## 2. Architecture

New `coach_profiles` module following the existing OOP pattern:

```
apps/api/src/modules/coach-profile/
  coach-profile.model.ts
  coach-profile.repository.ts
  coach-profile.repository.test.ts
  coach-profile.service.ts
  coach-profile.service.test.ts
  coach-profile.controller.ts
  coach-profile.routes.ts
  coach-profile.integration.test.ts
```

**Registration hook:** `AuthService.register()` creates an empty `coach_profiles` document immediately after creating the user. Slug is generated at this point.

**API endpoints** — all under `/api/v1/coach-profiles/me`, all require `authenticate` middleware. CoachId is pulled from the JWT, never from the URL.

| Method | Path                              | Description              |
| ------ | --------------------------------- | ------------------------ |
| GET    | `/api/v1/coach-profiles/me`       | Fetch my profile         |
| PATCH  | `/api/v1/coach-profiles/me`       | Update profile fields    |
| POST   | `/api/v1/coach-profiles/me/photo` | Upload photo (multipart) |

---

## 3. Data Model

Collection: `coach_profiles`

```
_id
coachId          — ObjectId ref users, unique index
slug             — string, unique index, immutable after creation
                   e.g. "coach-ron-a3f2"
isPublic         — boolean, default false
displayName      — string (defaults to user.name at creation)
bio              — string
photoUrl         — string (Cloudinary URL)
city             — string
specializations  — string[], values from fixed list (see §5)
sessionTypes     — ('private' | 'group')[]
privateRate      — number (PHP)
groupRate        — number (PHP)
ratesNote        — string
contactEmail     — string
contactPhone     — string
showContactInfo  — boolean, default false
totalViews       — number, default 0 (atomic $inc — used by public directory)
createdAt
updatedAt
```

---

## 4. Slug Generation

**Algorithm:**

1. `base = slugify(user.name)` — lowercase, spaces → hyphens, strip non-alphanumeric
2. `candidate = base + '-' + randomAlphanumeric(4)`
3. Query `coach_profiles` — does `candidate` exist?
4. If yes → generate new candidate, retry (max 5 attempts)
5. If all 5 collide → throw (astronomically unlikely; 36^4 = 1.68M permutations)

**Safety net:** Unique MongoDB index on `slug`. If two registrations race past the check simultaneously, the second DB write fails with a duplicate key error — caught and surfaced as a 500.

Slug is set once at registration and never changed.

---

## 5. Fixed Specializations List

```
beginner | intermediate | advanced | dinking | serve |
3rd-shot-drop | footwork | strategy | doubles | singles
```

Stored as the slug values above. Display labels (e.g. "3rd Shot Drop") handled on the frontend.

---

## 6. Photo Upload Flow

`POST /api/v1/coach-profiles/me/photo` (multipart/form-data, field name: `photo`)

1. `multer` parses the multipart request — file held in memory as a buffer (max 5MB, image types only)
2. API uploads buffer to Cloudinary using the Node SDK (`cloudinary.uploader.upload_stream`)
3. Cloudinary returns a secure URL
4. Service updates `coach_profiles.photoUrl` with the URL
5. Response: `{ success: true, data: { photoUrl } }`

**Env vars required:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

---

## 7. Frontend

**New route:** `/dashboard/public-profile`
**New sidebar nav item:** "Public Profile" (between Payments and Profile, using `Globe` icon from Lucide)

**Page structure:** Server component fetches `GET /me`, passes data to client components.

**Four independent cards, each with its own Save button:**

### Card 1 — Identity

- Profile photo (file input → `POST /me/photo`)
- Display name (text input)
- Bio (textarea)
- City (text input)

### Card 2 — Coaching Details

- Specializations — pill toggle buttons (tap to select/deselect, accent when active)
- Session types — pill toggle buttons (Private, Group)

### Card 3 — Rates

- Private rate (number input, PHP)
- Group rate (number input, PHP)
- Rates note (text input, optional)

### Card 4 — Contact & Visibility

- Contact email (text input, optional)
- Contact phone (text input, optional)
- Show contact info toggle
- List in directory toggle (`isPublic`)

**Public URL display** (read-only, shown at top of page):

```
Your public URL: picklecoach.com/coaches/{slug}
```

Shown always, even when `isPublic` is false — so coaches know their URL before going live.

---

## 8. Shared Types

Add to `packages/shared/src/types/index.ts`:

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
  sessionTypes: ('private' | 'group')[]
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

Add to `packages/shared/src/schemas/`:

```typescript
// coach-profile.schema.ts
export const updateCoachProfileSchema = z.object({
  displayName: z.string().min(1).optional(),
  bio: z.string().optional(),
  city: z.string().optional(),
  specializations: z.array(z.string()).optional(),
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

---

## 9. Testing Strategy

**Repository tests** (real `picklecoach_test` DB):

- `create()` stores all fields, slug is set
- `findByCoachId()` returns the profile
- `update()` updates fields, returns new doc
- `updatePhoto()` updates photoUrl

**Service tests** (mocked repository):

- `getMyProfile()` throws `PROFILE_NOT_FOUND` if missing
- `updateProfile()` delegates to repo and returns sanitized result
- `uploadPhoto()` calls Cloudinary, then repo.updatePhoto
- Slug generation: uniqueness check retries on collision

**Integration tests** (Supertest + real DB):

- `GET /me` returns profile for authenticated coach
- `PATCH /me` updates fields
- `POST /me/photo` with a small PNG buffer → returns photoUrl
- Unauthenticated requests return 401
