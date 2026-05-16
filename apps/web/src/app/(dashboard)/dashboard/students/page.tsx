import type { PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { StudentList } from '@/components/students/StudentList'

export default async function StudentsPage() {
  const students = await serverApiFetch<PublicStudent[]>('/api/v1/students')

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-text-primary">Students</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {students?.length ?? 0} active student{students?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="/dashboard/students/new"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-base transition-opacity hover:opacity-90"
        >
          + Add student
        </a>
      </div>

      <StudentList students={students ?? []} />
    </div>
  )
}
