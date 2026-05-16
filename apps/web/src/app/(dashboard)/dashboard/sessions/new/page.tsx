import type { PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { SessionForm } from '@/components/sessions/SessionForm'

export default async function NewSessionPage() {
  const students = await serverApiFetch<PublicStudent[]>('/api/v1/students')

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Schedule session</h1>
      <p className="mt-1 text-sm text-text-secondary">Set up a new coaching session</p>
      <div className="mt-6">
        <SessionForm students={students ?? []} />
      </div>
    </div>
  )
}
