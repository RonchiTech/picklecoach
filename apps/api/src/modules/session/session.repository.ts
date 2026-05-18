import { ISession, Session } from './session.model'
import type { SessionType, SessionStatus } from '@picklecoach/shared'

type CreateData = {
  coachId: string
  studentIds: string[]
  type: SessionType
  scheduledAt: Date
  durationMinutes: number
  notes?: string
}

export type SessionUpdateData = {
  studentIds?: string[]
  type?: SessionType
  status?: SessionStatus
  scheduledAt?: Date
  durationMinutes?: number
  notes?: string
  rating?: number
}

export interface ISessionRepository {
  findAllByCoach(coachId: string): Promise<ISession[]>
  findById(id: string, coachId: string): Promise<ISession | null>
  create(data: CreateData): Promise<ISession>
  update(id: string, coachId: string, data: SessionUpdateData): Promise<ISession | null>
  countTodayByCoach(coachId: string): Promise<number>
  clone(id: string, coachId: string): Promise<ISession>
}

export class SessionRepository implements ISessionRepository {
  async findAllByCoach(coachId: string): Promise<ISession[]> {
    return Session.find({ coachId }).sort({ scheduledAt: -1 })
  }

  async findById(id: string, coachId: string): Promise<ISession | null> {
    return Session.findOne({ _id: id, coachId })
  }

  async create(data: CreateData): Promise<ISession> {
    return Session.create(data)
  }

  async update(id: string, coachId: string, data: SessionUpdateData): Promise<ISession | null> {
    return Session.findOneAndUpdate({ _id: id, coachId }, { $set: data }, { new: true })
  }

  async countTodayByCoach(coachId: string): Promise<number> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    return Session.countDocuments({
      coachId,
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: 'cancelled' },
    })
  }

  async clone(id: string, coachId: string): Promise<ISession> {
    const original = await Session.findOne({ _id: id, coachId })
    if (!original) throw new Error('Session not found')
    const scheduledAt = new Date()
    scheduledAt.setDate(scheduledAt.getDate() + 7)
    return Session.create({
      coachId: original.coachId,
      studentIds: original.studentIds,
      type: original.type,
      scheduledAt,
      durationMinutes: original.durationMinutes,
      notes: original.notes,
    })
  }
}
