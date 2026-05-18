import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-base flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="font-outfit text-[5rem] font-black text-accent leading-none tracking-[-0.04em] mb-4">
          404
        </p>
        <h1 className="font-outfit text-2xl font-black tracking-tight text-white mb-3">
          Page not found
        </h1>
        <p className="text-sm text-muted leading-relaxed mb-8">
          This page does not exist or may have been moved.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="bg-accent text-[#0C0C10] font-bold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Go home
          </Link>
          <Link
            href="/coaches"
            className="bg-white/5 border border-white/[0.08] text-text-secondary font-semibold text-sm px-5 py-3 rounded-xl hover:bg-white/10 transition-colors"
          >
            Find a coach
          </Link>
        </div>
      </div>
    </main>
  )
}
