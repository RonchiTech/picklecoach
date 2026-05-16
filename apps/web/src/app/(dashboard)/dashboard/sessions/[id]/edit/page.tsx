import { notFound } from 'next/navigation'
import type { PublicSession, PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { SessionForm } from '@/components/sessions/SessionForm'

type Props = { params: Promise<{ id: string }> }

export default async function EditSessionPage({ params }: Props) {
  const { id } = await params
  const [session, students] = await Promise.all([
    serverApiFetch<PublicSession>(`/api/v1/sessions/${id}`),
    serverApiFetch<PublicStudent[]>('/api/v1/students'),
  ])

  if (!session) notFound()

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Edit session</h1>
      <p className="mt-1 text-sm text-text-secondary">Update session details or status</p>
      <div className="mt-6">
        <SessionForm students={students ?? []} session={session} />
      </div>
    </div>
  )
}
