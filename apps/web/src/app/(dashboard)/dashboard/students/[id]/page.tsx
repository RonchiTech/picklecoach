import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { PublicStudent, PublicProgressEntry, SkillLevel } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { ProgressTimeline } from '@/components/progress/ProgressTimeline'
import { AddProgressEntry } from '@/components/progress/AddProgressEntry'

const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  elite: 'Elite',
}

const SKILL_PILL: Record<SkillLevel, string> = {
  beginner: 'border border-border text-text-secondary',
  intermediate: 'bg-accent/10 text-accent',
  advanced: 'bg-accent/30 text-accent',
  elite: 'bg-accent text-base font-semibold',
}

type Props = { params: Promise<{ id: string }> }

export default async function StudentProgressPage({ params }: Props) {
  const { id } = await params
  const student = await serverApiFetch<PublicStudent>(`/api/v1/students/${id}`)
  if (!student) redirect('/dashboard/students')

  const entries =
    (await serverApiFetch<PublicProgressEntry[]>(`/api/v1/progress-entries?studentId=${id}`)) ?? []

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/students"
            className="mb-2 inline-block text-xs text-muted transition-colors hover:text-text-primary"
          >
            &larr; All students
          </Link>
          <h1 className="font-outfit text-3xl font-bold text-text-primary">{student.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs ${SKILL_PILL[student.skillLevel]}`}
            >
              {SKILL_LABEL[student.skillLevel]}
            </span>
            {student.email && <span className="text-xs text-muted">{student.email}</span>}
          </div>
        </div>
        <Link
          href={`/dashboard/students/${id}/edit`}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          Edit student
        </Link>
      </div>

      <div className="max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-outfit text-lg font-semibold text-text-primary">Progress Log</h2>
          <span className="text-xs text-muted">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <AddProgressEntry studentId={id} />

        <div className="mt-8">
          <ProgressTimeline entries={entries} />
        </div>
      </div>
    </div>
  )
}
