'use client'

import { useRouter } from 'next/navigation'
import type { PublicStudent, SkillLevel } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

const SKILL_PILL: Record<SkillLevel, string> = {
  beginner: 'border border-border text-text-secondary',
  intermediate: 'bg-accent/10 text-accent',
  advanced: 'bg-accent/30 text-accent',
  elite: 'bg-accent text-base font-semibold',
}

const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  elite: 'Elite',
}

type StudentListProps = {
  students: PublicStudent[]
}

export function StudentList({ students }: StudentListProps) {
  const router = useRouter()

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Archive ${name}? They will no longer appear in your student list.`)) return
    await apiFetch(`/api/v1/students/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (students.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-12 text-center">
        <p className="text-text-secondary">No students yet.</p>
        <a
          href="/dashboard/students/new"
          className="mt-4 inline-block rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-base"
        >
          Add your first student
        </a>
      </div>
    )
  }

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Level
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Contact
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {students.map((student, i) => (
            <tr
              key={student._id}
              className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surface/50'}`}
            >
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-text-primary">{student.name}</p>
                {student.notes && (
                  <p className="mt-0.5 text-xs text-muted line-clamp-1">{student.notes}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${SKILL_PILL[student.skillLevel]}`}
                >
                  {SKILL_LABEL[student.skillLevel]}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">
                {student.email || student.phone || <span className="text-muted">—</span>}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <a
                    href={`/dashboard/students/${student._id}/edit`}
                    className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => handleArchive(student._id, student.name)}
                    className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-error hover:text-error"
                  >
                    Archive
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
