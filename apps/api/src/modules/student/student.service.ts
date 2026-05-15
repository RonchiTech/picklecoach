import type { CreateStudentInput, UpdateStudentInput } from '@picklecoach/shared'
import type { IStudentRepository } from './student.repository'
import type { IStudent } from './student.model'
import { createError } from '../../middleware/error.middleware'

export class StudentService {
  constructor(private repo: IStudentRepository) {}

  async list(coachId: string): Promise<IStudent[]> {
    return this.repo.findAllByCoach(coachId)
  }

  async getOne(coachId: string, id: string): Promise<IStudent> {
    const student = await this.repo.findById(id, coachId)
    if (!student) throw createError('Student not found', 404, 'STUDENT_NOT_FOUND')
    return student
  }

  async create(coachId: string, input: CreateStudentInput): Promise<IStudent> {
    return this.repo.create({ ...input, coachId })
  }

  async update(coachId: string, id: string, input: UpdateStudentInput): Promise<IStudent> {
    const student = await this.repo.update(id, coachId, input)
    if (!student) throw createError('Student not found', 404, 'STUDENT_NOT_FOUND')
    return student
  }

  async archive(coachId: string, id: string): Promise<void> {
    const student = await this.repo.archive(id, coachId)
    if (!student) throw createError('Student not found', 404, 'STUDENT_NOT_FOUND')
  }
}
