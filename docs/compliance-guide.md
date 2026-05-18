# Compliance Guide — What You Need to Do

This guide covers the legal and administrative steps that cannot be done in code.
Each section tells you exactly what to do, why it matters, and how hard it is.

---

## 1. Designate yourself as Data Protection Officer (DPO)

**Law:** Data Privacy Act of 2012 (RA 10173), Section 21  
**Difficulty:** Easy — 30 minutes  
**When:** Before you launch publicly

The DPA requires every personal information controller to have a DPO.
For a solo founder, you designate yourself. There is no registration form for this —
you just need to document it internally and make your contact email available.

**What to do:**

1. Update the email in `apps/web/src/app/(marketing)/privacy/page.tsx`:
   - Change `CONTACT_EMAIL = 'privacy@picklecoach.app'` to your actual email address.
2. Keep a simple internal note (even a Google Doc) that says:
   > "I, [Your Full Name], am the designated Data Protection Officer for PickleCoach
   > as of [date]. Contact: [your email]."
3. That's it. You don't file this with anyone yet — NPC registration comes later (see #2).

---

## 2. Register with the National Privacy Commission (NPC)

**Law:** NPC Circular 17-01  
**Difficulty:** Medium — online form, takes ~1 hour  
**When:** When you reach 250 employees OR 1,000 data subjects (registered coaches)

You don't need to do this on Day 1. The NPC threshold is 1,000 data subjects
(in your case: 1,000 registered coaches). Register before you hit that number.

**What to do when the time comes:**

1. Go to: https://www.privacy.gov.ph/registration/
2. Create an account on the NPC portal.
3. Fill in the "Personal Data Processing System" form. For PickleCoach, your
   processing system is: "Coach account management, student data management,
   subscription processing."
4. Submit. The NPC will confirm by email.
5. After registration, update your Privacy Policy to include your NPC registration number.

**Key information you'll need:**

- Business name: PickleCoach (or your registered business name)
- Nature of data processed: Names, emails, phone numbers, student records
- Purpose: Service delivery (coach business management)
- Third-party processors: MongoDB Atlas, Cloudinary, Resend

---

## 3. Register with the DTI under ITA 2023

**Law:** Internet Transactions Act of 2023 (RA 11967)  
**Difficulty:** Medium — online registration  
**When:** Before launching commercially (before charging for Pro)

The ITA 2023 requires online merchants to register with the Department of Trade
and Industry (DTI). As a SaaS collecting payment (even manually via GCash),
PickleCoach is covered.

**What to do:**

1. Go to: https://eCommunity.dti.gov.ph (DTI's e-commerce registration portal)
2. Register as an "Online Seller / Digital Service Provider."
3. You'll need:
   - A valid government ID
   - Your business name or your personal name if operating as a sole proprietor
   - A description of your service ("SaaS platform for pickleball coaches")
4. Once registered, DTI will issue a Certificate of Registration.
5. Display your DTI registration number in your Terms of Service.
   In `apps/web/src/app/(marketing)/terms/page.tsx`, add it to the footer note.

**Note:** If you later register a formal business (sole proprietorship or OPC),
you can update this registration to reflect the business name.

---

## 4. Get your Privacy Policy and Terms of Service reviewed by a lawyer

**Difficulty:** Medium — costs money, but necessary  
**When:** Before you have 50+ coaches or before any public marketing push

The Privacy Policy and Terms of Service pages in this codebase are
good-faith drafts that reflect what the app actually does and reference
the correct Philippine laws. However, they are not a substitute for
legal advice.

**What to do:**

1. Find a Philippine lawyer who handles tech/startup law. You can try:
   - **Respicio & Co.** (respicio.com.ph) — known for startup/tech work
   - **DivinaLaw** (divinalaw.com) — has a tech practice
   - **LegalMatch Philippines** (legalmatch.ph) — connects you with lawyers
   - Facebook group: "Startup Lawyers PH" — often has lawyers offering free
     initial consultations
2. Share the two pages with them:
   - `/privacy` — your Privacy Policy
   - `/terms` — your Terms of Service
3. Ask them specifically to check:
   - Is the refund policy enforceable as written?
   - Are the DPA data subject rights correctly stated?
   - Does the limitation of liability clause hold under Philippine law?
   - Is anything missing for ITA 2023 compliance?
4. Budget: ₱3,000–₱10,000 for a review, depending on the lawyer.

**This is worth doing.** A well-reviewed ToS protects you from chargebacks,
disputes about refunds, and liability claims.

---

## 5. Decide your refund policy (the ToS is already written)

**Current policy in the Terms of Service:**

> "All Pro subscription payments are non-refundable."

This is the safest default for a solo founder — you cannot afford to manually
process refunds and disputes. However, you have options:

| Option                   | Pros                | Cons                            |
| ------------------------ | ------------------- | ------------------------------- |
| **No refunds (current)** | Simple, no disputes | Slightly reduces conversion     |
| **Pro-rated credit**     | Fairer to users     | Requires manual credit tracking |
| **7-day money back**     | Marketing advantage | Opens refund abuse              |

If you want to change the policy, edit the "Refund policy" section in:
`apps/web/src/app/(marketing)/terms/page.tsx`

---

## 6. Set up a data breach response procedure

**Law:** NPC Circular 16-03  
**Difficulty:** Easy — just write it down  
**When:** Before you launch

If a data breach happens (e.g. your database is exposed), you are legally
required to notify the NPC within 72 hours and notify affected users
"as soon as reasonably practicable."

Write a simple procedure now so you know what to do if it happens:

> **PickleCoach Data Breach Response (keep this somewhere safe):**
>
> 1. Immediately change all API keys, database passwords, and JWT secrets.
> 2. Take the app offline if the breach is ongoing.
> 3. Determine what data was exposed and how many users are affected.
> 4. Within 72 hours: Email the NPC at info@privacy.gov.ph with:
>    - What happened
>    - What data was exposed
>    - How many users affected
>    - What you've done to stop it
> 5. Email affected users with a clear explanation of what happened.
> 6. Document everything in writing.

---

## 7. Update the contact emails in the legal pages

Before going live, update these two constants in the code:

In `apps/web/src/app/(marketing)/privacy/page.tsx`:

```
const CONTACT_EMAIL = 'privacy@picklecoach.app'  ← change to your real email
```

In `apps/web/src/app/(marketing)/terms/page.tsx`:

```
const CONTACT_EMAIL = 'hello@picklecoach.app'  ← change to your real email
```

Both can be the same email address (your personal or business email).
You don't need a custom domain email to launch — Gmail works fine.

---

## Summary

| Task                                       | Do it now?                 | Estimated time    |
| ------------------------------------------ | -------------------------- | ----------------- |
| Designate yourself as DPO + update email   | Yes, before launch         | 30 min            |
| Set up breach response procedure           | Yes, before launch         | 30 min            |
| DTI registration                           | Yes, before charging       | 1–2 hours         |
| NPC registration                           | When you hit 1,000 coaches | 1 hour            |
| Lawyer review of Privacy Policy + ToS      | Before 50 coaches          | ₱3k–₱10k, 1 week  |
| Register a formal business (OPC/sole prop) | Optional for now           | Separate decision |
