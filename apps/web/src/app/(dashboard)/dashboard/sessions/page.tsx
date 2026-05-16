import type { PublicSession, PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { SessionList } from '@/components/sessions/SessionList'

export default async function SessionsPage() {
  const [sessions, students] = await Promise.all([
    serverApiFetch<PublicSession[]>('/api/v1/sessions'),
    serverApiFetch<PublicStudent[]>('/api/v1/students'),
  ])

  const studentMap = Object.fromEntries((students ?? []).map((s) => [s._id, s]))

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-text-primary">Sessions</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {sessions?.length ?? 0} session{sessions?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="/dashboard/sessions/new"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-base transition-opacity hover:opacity-90"
        >
          + Schedule session
        </a>
      </div>

      <div className="mt-6">
        <SessionList sessions={sessions ?? []} studentMap={studentMap} />
      </div>
    </div>
  )
}
