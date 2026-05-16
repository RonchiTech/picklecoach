import { redirect } from 'next/navigation'
import type { PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { StudentForm } from '@/components/students/StudentForm'

type Props = { params: Promise<{ id: string }> }

export default async function EditStudentPage({ params }: Props) {
  const { id } = await params
  const student = await serverApiFetch<PublicStudent>(`/api/v1/students/${id}`)
  if (!student) redirect('/dashboard/students')

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Edit Student</h1>
      <p className="mt-1 text-sm text-text-secondary">{student.name}</p>
      <div className="mt-8">
        <StudentForm student={student} />
      </div>
    </div>
  )
}
