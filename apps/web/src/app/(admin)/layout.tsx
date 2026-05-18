import { redirect } from 'next/navigation'
import type { PublicUser } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await serverApiFetch<PublicUser>('/api/v1/auth/me')
  if (!user) redirect('/login')
  if (user.role !== 'super_admin') redirect('/dashboard')

  return (
    <div className="flex h-screen bg-base">
      <AdminSidebar adminName={user.name} />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
