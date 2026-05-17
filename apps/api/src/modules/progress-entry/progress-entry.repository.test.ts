import mongoose from 'mongoose'
import { ProgressEntry } from './progress-entry.model'
import { ProgressEntryRepository } from './progress-entry.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new ProgressEntryRepository()

const COACH_A = new mongoose.Types.ObjectId().toString()
const COACH_B = new mongoose.Types.ObjectId().toString()
const STUDENT_A = new mongoose.Types.ObjectId().toString()
const STUDENT_B = new mongoose.Types.ObjectId().toString()

const seed = (overrides: Record<string, unknown> = {}) =>
  ProgressEntry.create({
    coachId: COACH_A,
    studentId: STUDENT_A,
    type: 'general',
    content: 'Good session today',
    skillTags: [],
    ...overrides,
  })

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await ProgressEntry.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await ProgressEntry.deleteMany({})
})

describe('ProgressEntryRepository.findByStudent', () => {
  it('returns empty array when no entries exist', async () => {
    expect(await repo.findByStudent(COACH_A, STUDENT_A)).toEqual([])
  })

  it('returns only entries for the given coach and student', async () => {
    await seed({ content: 'Entry A' })
    await seed({ coachId: COACH_B, content: 'Other coach' })
    await seed({ studentId: STUDENT_B, content: 'Other student' })

    const result = await repo.findByStudent(COACH_A, STUDENT_A)
    expect(result).toHaveLength(1)
    expect(result[0].content).toBe('Entry A')
  })

  it('returns entries sorted newest first', async () => {
    await seed({ content: 'First', createdAt: new Date('2026-01-01') })
    await seed({ content: 'Second', createdAt: new Date('2026-01-02') })

    const result = await repo.findByStudent(COACH_A, STUDENT_A)
    expect(result[0].content).toBe('Second')
    expect(result[1].content).toBe('First')
  })
})

describe('ProgressEntryRepository.findById', () => {
  it('returns null for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    expect(await repo.findById(fakeId, COACH_A)).toBeNull()
  })

  it('returns null when entry belongs to a different coach', async () => {
    const entry = await seed()
    expect(await repo.findById(entry._id.toString(), COACH_B)).toBeNull()
  })

  it('returns the entry when id and coachId match', async () => {
    const entry = await seed({ content: 'Match' })
    const found = await repo.findById(entry._id.toString(), COACH_A)
    expect(found?.content).toBe('Match')
  })
})

describe('ProgressEntryRepository.create', () => {
  it('creates and returns an entry with correct fields', async () => {
    const entry = await repo.create({
      coachId: COACH_A,
      studentId: STUDENT_A,
      type: 'goal',
      content: 'Work on dinking',
      skillTags: ['dinking'],
    })
    expect(entry.content).toBe('Work on dinking')
    expect(entry.type).toBe('goal')
    expect(entry.skillTags).toEqual(['dinking'])
    expect(entry.coachId.toString()).toBe(COACH_A)
  })
})

describe('ProgressEntryRepository.update', () => {
  it('returns null when entry not found or wrong coach', async () => {
    const entry = await seed()
    expect(await repo.update(entry._id.toString(), COACH_B, { content: 'Hacked' })).toBeNull()
  })

  it('updates content and returns the updated entry', async () => {
    const entry = await seed({ content: 'Old' })
    const updated = await repo.update(entry._id.toString(), COACH_A, { content: 'New' })
    expect(updated?.content).toBe('New')
  })
})

describe('ProgressEntryRepository.delete', () => {
  it('returns false when entry not found or wrong coach', async () => {
    const entry = await seed()
    expect(await repo.delete(entry._id.toString(), COACH_B)).toBe(false)
  })

  it('deletes the entry and returns true', async () => {
    const entry = await seed()
    const result = await repo.delete(entry._id.toString(), COACH_A)
    expect(result).toBe(true)
    expect(await ProgressEntry.findById(entry._id)).toBeNull()
  })
})
