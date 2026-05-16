import mongoose from 'mongoose'
import { Session } from './session.model'
import { SessionRepository } from './session.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new SessionRepository()

const COACH_A = new mongoose.Types.ObjectId().toString()
const COACH_B = new mongoose.Types.ObjectId().toString()
const STUDENT_ID = new mongoose.Types.ObjectId()

const seed = (overrides: Record<string, unknown> = {}) =>
  Session.create({
    coachId: COACH_A,
    studentIds: [STUDENT_ID],
    type: 'private',
    status: 'scheduled',
    scheduledAt: new Date(),
    durationMinutes: 60,
    ...overrides,
  })

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await Session.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await Session.deleteMany({})
})

describe('SessionRepository.findAllByCoach', () => {
  it('returns empty array when coach has no sessions', async () => {
    const result = await repo.findAllByCoach(COACH_A)
    expect(result).toEqual([])
  })

  it('returns only sessions belonging to the given coach', async () => {
    await seed()
    await seed({ coachId: COACH_B })

    const result = await repo.findAllByCoach(COACH_A)
    expect(result).toHaveLength(1)
  })

  it('returns sessions sorted by scheduledAt descending', async () => {
    const earlier = new Date(Date.now() - 60 * 60 * 1000)
    const later = new Date(Date.now() + 60 * 60 * 1000)
    await seed({ scheduledAt: earlier })
    await seed({ scheduledAt: later })

    const result = await repo.findAllByCoach(COACH_A)
    expect(result[0].scheduledAt.getTime()).toBeGreaterThan(result[1].scheduledAt.getTime())
  })
})

describe('SessionRepository.findById', () => {
  it('returns null for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    expect(await repo.findById(fakeId, COACH_A)).toBeNull()
  })

  it('returns null when session belongs to a different coach', async () => {
    const session = await seed()
    expect(await repo.findById(session._id.toString(), COACH_B)).toBeNull()
  })

  it('returns the session when id and coachId match', async () => {
    const session = await seed({ type: 'group' })
    const found = await repo.findById(session._id.toString(), COACH_A)
    expect(found?.type).toBe('group')
  })
})

describe('SessionRepository.create', () => {
  it('creates and returns a session with coachId and default status', async () => {
    const session = await repo.create({
      coachId: COACH_A,
      studentIds: [STUDENT_ID.toString()],
      type: 'private',
      scheduledAt: new Date(),
      durationMinutes: 45,
    })
    expect(session.coachId.toString()).toBe(COACH_A)
    expect(session.status).toBe('scheduled')
    expect(session.durationMinutes).toBe(45)
  })
})

describe('SessionRepository.update', () => {
  it('returns null when session not found or wrong coach', async () => {
    const session = await seed()
    expect(await repo.update(session._id.toString(), COACH_B, { status: 'completed' })).toBeNull()
  })

  it('updates and returns the updated session', async () => {
    const session = await seed()
    const updated = await repo.update(session._id.toString(), COACH_A, {
      status: 'completed',
      notes: 'Great session',
    })
    expect(updated?.status).toBe('completed')
    expect(updated?.notes).toBe('Great session')
  })
})

describe('SessionRepository.countTodayByCoach', () => {
  it('returns 0 when coach has no sessions today', async () => {
    expect(await repo.countTodayByCoach(COACH_A)).toBe(0)
  })

  it('counts scheduled and completed sessions today but not cancelled', async () => {
    await seed({ status: 'scheduled' })
    await seed({ status: 'completed' })
    await seed({ status: 'cancelled' })
    await seed({ coachId: COACH_B })

    expect(await repo.countTodayByCoach(COACH_A)).toBe(2)
  })

  it('does not count sessions from other days', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    await seed({ scheduledAt: yesterday })

    expect(await repo.countTodayByCoach(COACH_A)).toBe(0)
  })
})
