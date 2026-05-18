'use client'

import { useRouter } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, Tag, ArrowUpCircle, Settings } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { AdminNavItem } from './AdminNavItem'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', Icon: LayoutDashboard },
  { href: '/admin/coaches', label: 'Coaches', Icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', Icon: CreditCard },
  { href: '/admin/promotions', label: 'Promotions', Icon: Tag },
  { href: '/admin/upgrade-requests', label: 'Upgrade Requests', Icon: ArrowUpCircle },
  { href: '/admin/settings', label: 'Settings', Icon: Settings },
]

type AdminSidebarProps = {
  adminName: string
}

export function AdminSidebar({ adminName }: AdminSidebarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-52 flex-shrink-0 flex-col border-r border-border bg-base px-3 py-5">
      <div className="mb-8 px-3">
        <span className="font-outfit text-xl font-bold text-accent">PickleCoach</span>
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-muted">Admin</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <AdminNavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-text-primary">{adminName}</p>
          <p className="mt-0.5 text-xs text-text-secondary">Super Admin</p>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:border-error hover:text-error"
        >
          Log out
        </button>
      </div>
    </aside>
  )
}
