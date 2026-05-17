import { redirect } from 'next/navigation'
import type { SubscriptionTier, SubscriptionInfo } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { Sidebar } from '@/components/dashboard/Sidebar'

type UserData = {
  name: string
  subscriptionTier: SubscriptionTier
  subscriptionStatus: string
}

function LockedState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
        Account Locked
      </p>
      <h1 className="font-outfit text-4xl font-black text-white">Your trial has ended</h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-secondary">
        Your 3-month free trial and 7-day grace period have both expired. Your data is safe —
        contact us to reactivate your account.
      </p>
      <a
        href="mailto:hello@picklecoach.com"
        className="mt-8 rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-[#0C0C10] transition-opacity hover:opacity-90"
      >
        Contact Support
      </a>
    </div>
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await serverApiFetch<UserData>('/api/v1/auth/me')
  if (!user) redirect('/login')

  const sub = await serverApiFetch<SubscriptionInfo>('/api/v1/subscriptions/me')
  const isLocked = sub?.isLocked ?? false

  return (
    <div className="flex h-screen bg-base">
      <Sidebar
        coachName={user.name}
        subscriptionTier={user.subscriptionTier}
        subscriptionStatus={user.subscriptionStatus}
      />
      <main className="flex-1 overflow-auto p-8">{isLocked ? <LockedState /> : children}</main>
    </div>
  )
}
