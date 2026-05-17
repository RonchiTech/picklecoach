import { IProgressEntry, ProgressEntry } from './progress-entry.model'
import type { UpdateProgressEntryInput } from '@picklecoach/shared'

type CreateData = {
  coachId: string
  studentId: string
  sessionId?: string
  type: string
  content: string
  skillTags: string[]
}

export interface IProgressEntryRepository {
  findByStudent(coachId: string, studentId: string): Promise<IProgressEntry[]>
  findById(id: string, coachId: string): Promise<IProgressEntry | null>
  create(data: CreateData): Promise<IProgressEntry>
  update(
    id: string,
    coachId: string,
    data: UpdateProgressEntryInput
  ): Promise<IProgressEntry | null>
  delete(id: string, coachId: string): Promise<boolean>
}

export class ProgressEntryRepository implements IProgressEntryRepository {
  async findByStudent(coachId: string, studentId: string): Promise<IProgressEntry[]> {
    return ProgressEntry.find({ coachId, studentId }).sort({ createdAt: -1 })
  }

  async findById(id: string, coachId: string): Promise<IProgressEntry | null> {
    return ProgressEntry.findOne({ _id: id, coachId })
  }

  async create(data: CreateData): Promise<IProgressEntry> {
    return ProgressEntry.create(data)
  }

  async update(
    id: string,
    coachId: string,
    data: UpdateProgressEntryInput
  ): Promise<IProgressEntry | null> {
    return ProgressEntry.findOneAndUpdate({ _id: id, coachId }, { $set: data }, { new: true })
  }

  async delete(id: string, coachId: string): Promise<boolean> {
    const result = await ProgressEntry.deleteOne({ _id: id, coachId })
    return result.deletedCount === 1
  }
}
