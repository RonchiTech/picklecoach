import { SessionService } from './session.service'
import type { ISessionRepository } from './session.repository'
import type { ISession } from './session.model'
import mongoose from 'mongoose'

const COACH_ID = 'coach-123'
const SESSION_ID = new mongoose.Types.ObjectId().toString()

const mockSession = {
  _id: { toString: () => SESSION_ID },
  coachId: { toString: () => COACH_ID },
  studentIds: [],
  type: 'private',
  status: 'scheduled',
  scheduledAt: new Date(),
  durationMinutes: 60,
} as unknown as ISession

const mockRepo: jest.Mocked<ISessionRepository> = {
  findAllByCoach: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  countTodayByCoach: jest.fn(),
  clone: jest.fn(),
}

let service: SessionService

beforeEach(() => {
  jest.clearAllMocks()
  service = new SessionService(mockRepo)
})

describe('SessionService.list', () => {
  it('returns sessions for the given coach', async () => {
    mockRepo.findAllByCoach.mockResolvedValue([mockSession])
    const result = await service.list(COACH_ID)
    expect(result).toHaveLength(1)
    expect(mockRepo.findAllByCoach).toHaveBeenCalledWith(COACH_ID)
  })
})

describe('SessionService.getOne', () => {
  it('throws SESSION_NOT_FOUND when session does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null)
    await expect(service.getOne(COACH_ID, SESSION_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'SESSION_NOT_FOUND',
    })
  })

  it('returns the session when found', async () => {
    mockRepo.findById.mockResolvedValue(mockSession)
    const result = await service.getOne(COACH_ID, SESSION_ID)
    expect(result.type).toBe('private')
  })
})

describe('SessionService.create', () => {
  it('converts scheduledAt string to Date and calls repo.create', async () => {
    mockRepo.create.mockResolvedValue(mockSession)
    const isoString = new Date().toISOString()
    await service.create(COACH_ID, {
      studentIds: ['student-1'],
      type: 'private',
      scheduledAt: isoString,
      durationMinutes: 60,
    })
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        coachId: COACH_ID,
        scheduledAt: expect.any(Date),
      })
    )
  })
})

describe('SessionService.update', () => {
  it('throws SESSION_NOT_FOUND when session does not exist or wrong coach', async () => {
    mockRepo.update.mockResolvedValue(null)
    await expect(
      service.update(COACH_ID, SESSION_ID, { status: 'completed' })
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'SESSION_NOT_FOUND',
    })
  })

  it('converts scheduledAt string to Date when provided', async () => {
    const updatedSession = { ...mockSession, status: 'completed' } as unknown as ISession
    mockRepo.update.mockResolvedValue(updatedSession)
    const isoString = new Date().toISOString()
    await service.update(COACH_ID, SESSION_ID, { scheduledAt: isoString })
    expect(mockRepo.update).toHaveBeenCalledWith(
      SESSION_ID,
      COACH_ID,
      expect.objectContaining({ scheduledAt: expect.any(Date) })
    )
  })

  it('returns the updated session', async () => {
    const updated = { ...mockSession, status: 'completed' } as unknown as ISession
    mockRepo.update.mockResolvedValue(updated)
    const result = await service.update(COACH_ID, SESSION_ID, { status: 'completed' })
    expect(result.status).toBe('completed')
  })
})
