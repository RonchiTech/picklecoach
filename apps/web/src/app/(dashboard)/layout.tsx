import { redirect } from 'next/navigation'
import type { PublicUser } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await serverApiFetch<PublicUser>('/api/v1/auth/me')
  if (!user) redirect('/login')
  if (user.role === 'super_admin') redirect('/admin')

  return (
    <div className="flex h-screen bg-base">
      <Sidebar coachName={user.name} subscriptionTier={user.subscriptionTier} />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
