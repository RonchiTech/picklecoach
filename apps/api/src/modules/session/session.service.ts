import type { CreateSessionInput, UpdateSessionInput } from '@picklecoach/shared'
import type { ISessionRepository, SessionUpdateData } from './session.repository'
import type { ISession } from './session.model'
import { createError } from '../../middleware/error.middleware'

export class SessionService {
  constructor(private repo: ISessionRepository) {}

  async list(coachId: string): Promise<ISession[]> {
    return this.repo.findAllByCoach(coachId)
  }

  async getOne(coachId: string, id: string): Promise<ISession> {
    const session = await this.repo.findById(id, coachId)
    if (!session) throw createError('Session not found', 404, 'SESSION_NOT_FOUND')
    return session
  }

  async create(coachId: string, input: CreateSessionInput): Promise<ISession> {
    return this.repo.create({
      coachId,
      studentIds: input.studentIds,
      type: input.type ?? 'private',
      scheduledAt: new Date(input.scheduledAt),
      durationMinutes: input.durationMinutes ?? 60,
      notes: input.notes,
    })
  }

  async update(coachId: string, id: string, input: UpdateSessionInput): Promise<ISession> {
    const { scheduledAt: rawDate, ...rest } = input
    const data: SessionUpdateData = {
      ...rest,
      ...(rawDate !== undefined ? { scheduledAt: new Date(rawDate) } : {}),
    }
    const session = await this.repo.update(id, coachId, data)
    if (!session) throw createError('Session not found', 404, 'SESSION_NOT_FOUND')
    return session
  }
}
