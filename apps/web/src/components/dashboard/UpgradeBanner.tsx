import Link from 'next/link'

export function UpgradeBanner() {
  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-text-primary">Unlock Pro features</p>
        <p className="mt-0.5 text-xs text-text-secondary">
          Get student progress tracking for ₱149/mo.
        </p>
      </div>
      <Link
        href="/dashboard/upgrade"
        className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-[#0C0C10] transition-opacity hover:opacity-90"
      >
        Request Pro
      </Link>
    </div>
  )
}
