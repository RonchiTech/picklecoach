# SEO — Remaining Manual Steps

Two things left that require you to act:

## 1. Set `NEXT_PUBLIC_SITE_URL` in production

Every canonical URL, the robots.txt sitemap link, and the sitemap itself fall back
to `http://localhost:3000` if this variable is not set.

**Where to set it:** your deployment platform (Vercel, Railway, etc.)

```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

No trailing slash.

---

## 2. Add an OG image

Without an image, social shares (Twitter, Facebook, iMessage) show a blank card.

**Steps:**

1. Create a `1200 × 630 px` image — your logo/brand on a dark background works fine.
2. Save it to `apps/web/public/og.png` (create the `public/` folder if it doesn't exist).
3. Add the image reference to the root layout and landing page metadata:

In `apps/web/src/app/layout.tsx`, inside the `openGraph` block:

```ts
openGraph: {
  ...
  images: [{ url: '/og.png', width: 1200, height: 630 }],
},
twitter: {
  ...
  images: ['/og.png'],
},
```

In `apps/web/src/app/(marketing)/page.tsx`, inside the `openGraph` block:

```ts
openGraph: {
  ...
  images: [{ url: '/og.png', width: 1200, height: 630 }],
},
```

---

Everything else (title tags, meta descriptions, canonical URLs, robots.txt,
sitemap, JSON-LD, og:locale) is already implemented and live.
