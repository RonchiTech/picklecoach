import Link from 'next/link'

export default function MarketingNav() {
  return (
    <nav className="flex items-center justify-between px-5 sm:px-14 py-5 border-b border-border">
      <Link href="/" className="font-outfit text-xl font-black tracking-tight">
        Pickle<span className="text-accent">Coach</span>
      </Link>
      <div className="hidden sm:flex gap-8">
        <Link href="/coaches" className="text-sm text-muted hover:text-white transition-colors">
          Find a Coach
        </Link>
        <a href="#pricing" className="text-sm text-muted hover:text-white transition-colors">
          Pricing
        </a>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="hidden sm:block text-sm text-muted hover:text-white transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="bg-accent text-[#0C0C10] text-sm font-bold px-4 sm:px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Start free →
        </Link>
      </div>
    </nav>
  )
}
