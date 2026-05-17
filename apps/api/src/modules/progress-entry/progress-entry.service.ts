import type { CreateProgressEntryInput, UpdateProgressEntryInput } from '@picklecoach/shared'
import type { IProgressEntryRepository } from './progress-entry.repository'
import type { IProgressEntry } from './progress-entry.model'
import { createError } from '../../middleware/error.middleware'

export class ProgressEntryService {
  constructor(private repo: IProgressEntryRepository) {}

  async list(coachId: string, studentId: string): Promise<IProgressEntry[]> {
    return this.repo.findByStudent(coachId, studentId)
  }

  async create(coachId: string, input: CreateProgressEntryInput): Promise<IProgressEntry> {
    return this.repo.create({
      coachId,
      studentId: input.studentId,
      sessionId: input.sessionId,
      type: input.type ?? 'general',
      content: input.content,
      skillTags: input.skillTags ?? [],
    })
  }

  async update(
    coachId: string,
    id: string,
    input: UpdateProgressEntryInput
  ): Promise<IProgressEntry> {
    const entry = await this.repo.update(id, coachId, input)
    if (!entry) throw createError('Progress entry not found', 404, 'ENTRY_NOT_FOUND')
    return entry
  }

  async delete(coachId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(id, coachId)
    if (!deleted) throw createError('Progress entry not found', 404, 'ENTRY_NOT_FOUND')
  }
}
