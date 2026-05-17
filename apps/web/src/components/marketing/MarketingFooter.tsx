import Link from 'next/link'

export default function MarketingFooter() {
  return (
    <footer className="border-t border-border px-14 py-7 flex justify-between items-center">
      <span className="font-outfit font-black">
        Pickle<span className="text-accent">Coach</span>
      </span>
      <div className="flex gap-5">
        <Link href="/coaches" className="text-xs text-[#333] hover:text-muted transition-colors">
          Find a Coach
        </Link>
        <a href="#pricing" className="text-xs text-[#333] hover:text-muted transition-colors">
          Pricing
        </a>
        <Link href="/privacy" className="text-xs text-[#333] hover:text-muted transition-colors">
          Privacy
        </Link>
        <Link href="/terms" className="text-xs text-[#333] hover:text-muted transition-colors">
          Terms
        </Link>
      </div>
      <span className="text-xs text-[#2a2a2a]">© 2026 PickleCoach</span>
    </footer>
  )
}
