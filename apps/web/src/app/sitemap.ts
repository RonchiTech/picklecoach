import type { MetadataRoute } from 'next'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let slugs: string[] = []
  try {
    const res = await fetch(`${API}/api/v1/coaches/slugs`, { cache: 'no-store' })
    const json = await res.json()
    slugs = Array.isArray(json?.data) ? json.data : []
  } catch {
    // If API is unavailable at build time, still generate static entries
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE}/coaches`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  const coachPages: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE}/coaches/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...coachPages]
}
