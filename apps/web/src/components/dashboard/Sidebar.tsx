'use client'

import { useRouter } from 'next/navigation'
import { LayoutDashboard, Users, CalendarDays, CreditCard, Globe, UserCircle } from 'lucide-react'
import type { SubscriptionTier } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'
import { NavItem } from './NavItem'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/dashboard/students', label: 'Students', Icon: Users },
  { href: '/dashboard/sessions', label: 'Sessions', Icon: CalendarDays },
  { href: '/dashboard/payments', label: 'Payments', Icon: CreditCard },
  { href: '/dashboard/public-profile', label: 'Public Profile', Icon: Globe },
  { href: '/dashboard/profile', label: 'Profile', Icon: UserCircle },
]

const TIER_LABELS: Record<SubscriptionTier, string> = {
  starter: 'Starter',
  pro: 'Pro',
  team: 'Team',
}

type SidebarProps = {
  coachName: string
  subscriptionTier: SubscriptionTier
}

export function Sidebar({ coachName, subscriptionTier }: SidebarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-52 flex-shrink-0 flex-col border-r border-border bg-base px-3 py-5">
      <div className="mb-8 px-3">
        <span className="font-outfit text-xl font-bold text-accent">PickleCoach</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-text-primary">{coachName}</p>
          <p className="mt-0.5 text-xs text-text-secondary">{TIER_LABELS[subscriptionTier]}</p>
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
