'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

type AdminNavItemProps = {
  href: string
  label: string
  Icon: LucideIcon
}

export function AdminNavItem({ href, label, Icon }: AdminNavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
        isActive
          ? 'bg-accent/10 font-semibold text-accent'
          : 'font-dm text-text-secondary hover:bg-surface hover:text-text-primary'
      }`}
    >
      <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
      {label}
    </Link>
  )
}
