import { StudentForm } from '@/components/students/StudentForm'

export default function NewStudentPage() {
  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Add Student</h1>
      <p className="mt-1 text-sm text-text-secondary">Add a new student to your roster</p>
      <div className="mt-8">
        <StudentForm />
      </div>
    </div>
  )
}
