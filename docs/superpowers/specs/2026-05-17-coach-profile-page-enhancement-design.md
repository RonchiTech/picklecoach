# Coach Public Profile Page Enhancement — Design Spec

**Date:** 2026-05-17
**Status:** Approved
**File:** `apps/web/src/app/(public)/coaches/[slug]/page.tsx`

---

## 1. Problem

The current `/coaches/[slug]` page is a single flat `bg-surface` card with no visual personality. All pills are plain gray borders, rates are inline text, the avatar fallback is a gray circle with a letter, and there is no contact affordance beyond raw text. It does not reflect the Midnight+Lime design system.

---

## 2. Design Decisions

| Question             | Choice                                                                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout               | Editorial / Open — no outer card wrapper, sections separated by `border-border` dividers on `bg-base`                                                                                                     |
| Avatar               | 80px circle, lime double-ring shadow (`box-shadow: 0 0 0 3px #C8F135, 0 0 0 6px #0C0C10, 0 0 0 7px #22222E`). With photo: ring frames it. Without photo: lime gradient fill + dark initial in Outfit font |
| Specialization pills | Coach's selected specializations → `bg-accent text-[#0C0C10] font-bold`. Non-selected (displayed for context) → `bg-surface border border-border text-muted`                                              |
| Rates                | Large Outfit font (text-[26px] font-black). Private rate in `text-accent`, group rate in `text-white`                                                                                                     |
| Session types        | Active types get `border-accent text-accent`, inactive get `border-border text-muted`                                                                                                                     |
| Contact section      | Lime-bordered card (`border-accent`) at page bottom with "Interested in coaching?" heading, email row (accent color), phone row (muted), view count as quiet footnote                                     |

---

## 3. Page Structure

```
← Back to directory                          (text-muted link)

[avatar]  Coach Display Name                 (text-2xl font-black Outfit)
          Makati, Metro Manila               (text-muted text-sm)
          [Beginner] [Strategy] [Dinking]   (pills — lime for selected, muted for rest)

──────────────────────────────────────────── (border-border divider)

About
Body text in text-muted, line-height relaxed

──────────────────────────────────────────── (divider, only if bio present)

Sessions & Rates
[Private ✓] [Group]                         (lime border = active, muted = inactive)
₱1,500 /hr     ₱800 /hr                    (Outfit font, accent + white)
Rates note (optional, text-xs text-muted)

──────────────────────────────────────────── (divider, only if rates section present)

┌─ Interested in coaching? ──── 312 views ─┐  (lime border card)
│  Reach out directly…                      │
│  [✉ email@coach.ph          ]            │
│  [📱 +63 917 123 4567       ]            │
└───────────────────────────────────────────┘  (only rendered when showContactInfo: true)
```

---

## 4. Conditional Rendering Rules

| Section          | Condition                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| Bio / About      | Render only if `coach.bio` is non-empty                                                                          |
| Sessions & Rates | Render only if `coach.sessionTypes.length > 0`                                                                   |
| Rate figures     | Private rate row only if `coach.privateRate` is set; group rate row only if `coach.groupRate` is set             |
| Rates note       | Only if `coach.ratesNote` is non-empty                                                                           |
| Contact card     | Only if `coach.showContactInfo === true` AND at least one of `coach.contactEmail` or `coach.contactPhone` is set |
| Email row        | Only if `coach.contactEmail` is non-empty                                                                        |
| Phone row        | Only if `coach.contactPhone` is non-empty                                                                        |
| View count       | Always shown inside the contact card when contact card renders; hidden otherwise                                 |

---

## 5. Implementation Scope

**Single file change:** `apps/web/src/app/(public)/coaches/[slug]/page.tsx`

No backend changes. No new components. No new API endpoints. The `totalViews` field is already incremented server-side on each page load — this change only affects how it is displayed.

The `SPEC_LABELS` map stays in the same file.

---

## 6. What Does NOT Change

- The API — `GET /api/v1/coaches/:slug` is unchanged
- The `PublicCoachProfile` shared type — unchanged
- The `/coaches` listing page — unchanged
- `publicApiFetch` — unchanged
- `next/image` usage for real photos — unchanged, same `width={80} height={80} className="rounded-full object-cover"`

---

## 7. Design Tokens Reference

| Token                           | Value                                                            | Usage                                                                    |
| ------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `bg-base`                       | `#0C0C10`                                                        | Page background                                                          |
| `bg-surface`                    | `#16161E`                                                        | Contact card background                                                  |
| `border-border`                 | `#22222E`                                                        | Section dividers, inactive pills                                         |
| `text-muted` / `text-[#555566]` | `#555566`                                                        | Secondary labels, inactive text                                          |
| `text-accent` / `bg-accent`     | `#C8F135`                                                        | Active pills, avatar fill, email link, private rate, contact card border |
| Outfit font                     | `font-outfit`                                                    | Display name, rate figures, avatar initial                               |
| Avatar ring                     | `shadow-[0_0_0_3px_#C8F135,0_0_0_6px_#0C0C10,0_0_0_7px_#22222E]` | Both photo and fallback                                                  |
