import type { Metadata } from 'next'
import { Suspense } from 'react'
import type { CoachDirectoryResult } from '@picklecoach/shared'
import { publicApiFetch } from '@/lib/public-api'
import { CoachCard } from '@/components/coaches/CoachCard'
import { CoachFilters } from '@/components/coaches/CoachFilters'
import { CoachPagination } from '@/components/coaches/CoachPagination'

export const metadata: Metadata = {
  title: 'Find a Pickleball Coach',
  description:
    'Browse certified pickleball coaches in the Philippines. Filter by specialization, city, or session type.',
  openGraph: {
    title: 'Find a Pickleball Coach | PickleCoach',
    description:
      'Browse certified pickleball coaches in the Philippines. Filter by specialization, city, or session type.',
    url: '/coaches',
  },
}

type SearchParams = Promise<{
  specialization?: string
  city?: string
  sessionType?: string
  page?: string
}>

export default async function CoachesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const qs = new URLSearchParams()
  if (sp.specialization) qs.set('specialization', sp.specialization)
  if (sp.city) qs.set('city', sp.city)
  if (sp.sessionType) qs.set('sessionType', sp.sessionType)
  if (sp.page) qs.set('page', sp.page)

  const result = await publicApiFetch<CoachDirectoryResult>(`/api/v1/coaches?${qs.toString()}`)
  const page = Number(sp.page ?? 1)

  return (
    <main className="min-h-screen bg-base px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-outfit mb-2 text-4xl font-bold text-text-primary">
          Find a <span className="text-accent">Coach</span>
        </h1>
        <p className="mb-8 text-text-secondary">Browse pickleball coaches in the Philippines.</p>

        <Suspense>
          <CoachFilters />
        </Suspense>

        {!result || result.coaches.length === 0 ? (
          <p className="mt-12 text-center text-text-secondary">
            No coaches found. Try adjusting your filters.
          </p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.coaches.map((coach) => (
                <CoachCard key={coach._id} coach={coach} />
              ))}
            </div>
            <Suspense>
              <CoachPagination page={page} totalPages={result.totalPages} />
            </Suspense>
          </>
        )}
      </div>
    </main>
  )
}
