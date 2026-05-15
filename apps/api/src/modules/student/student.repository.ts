import { IStudent, Student } from './student.model'
import type { CreateStudentInput, UpdateStudentInput } from '@picklecoach/shared'

type CreateData = Pick<CreateStudentInput, 'name' | 'email' | 'phone' | 'skillLevel' | 'notes'> & {
  coachId: string
}

export interface IStudentRepository {
  findAllByCoach(coachId: string): Promise<IStudent[]>
  findById(id: string, coachId: string): Promise<IStudent | null>
  create(data: CreateData): Promise<IStudent>
  update(id: string, coachId: string, data: UpdateStudentInput): Promise<IStudent | null>
  archive(id: string, coachId: string): Promise<IStudent | null>
  countActiveByCoach(coachId: string): Promise<number>
}

export class StudentRepository implements IStudentRepository {
  async findAllByCoach(coachId: string): Promise<IStudent[]> {
    return Student.find({ coachId, isActive: true }).sort({ name: 1 })
  }

  async findById(id: string, coachId: string): Promise<IStudent | null> {
    return Student.findOne({ _id: id, coachId })
  }

  async create(data: CreateData): Promise<IStudent> {
    return Student.create(data)
  }

  async update(id: string, coachId: string, data: UpdateStudentInput): Promise<IStudent | null> {
    return Student.findOneAndUpdate({ _id: id, coachId }, { $set: data }, { new: true })
  }

  async archive(id: string, coachId: string): Promise<IStudent | null> {
    return Student.findOneAndUpdate(
      { _id: id, coachId },
      { $set: { isActive: false } },
      { new: true }
    )
  }

  async countActiveByCoach(coachId: string): Promise<number> {
    return Student.countDocuments({ coachId, isActive: true })
  }
}
