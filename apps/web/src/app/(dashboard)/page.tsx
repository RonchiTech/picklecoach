import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

export default async function DashboardPage() {
  const authenticated = await isAuthenticated()
  if (!authenticated) redirect('/login')

  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="mt-2 text-text-secondary">Coming in Plan 3</p>
      </div>
    </div>
  )
}
