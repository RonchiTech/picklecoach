'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function CoachPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter()
  const params = useSearchParams()

  if (totalPages <= 1) return null

  function goTo(p: number) {
    const next = new URLSearchParams(params.toString())
    next.set('page', String(p))
    router.push(`/coaches?${next.toString()}`)
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary transition-colors hover:border-accent disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-text-secondary">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary transition-colors hover:border-accent disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}
