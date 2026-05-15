import mongoose from 'mongoose'
import { Student } from './student.model'
import { StudentRepository } from './student.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new StudentRepository()

const COACH_A = new mongoose.Types.ObjectId().toString()
const COACH_B = new mongoose.Types.ObjectId().toString()

const seed = (overrides: Record<string, unknown> = {}) =>
  Student.create({
    coachId: COACH_A,
    name: 'John Doe',
    skillLevel: 'beginner',
    isActive: true,
    ...overrides,
  })

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await Student.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await Student.deleteMany({})
})

describe('StudentRepository.findAllByCoach', () => {
  it('returns empty array when coach has no students', async () => {
    const result = await repo.findAllByCoach(COACH_A)
    expect(result).toEqual([])
  })

  it('returns only active students for the given coach', async () => {
    await seed({ name: 'Active Student' })
    await seed({ name: 'Archived Student', isActive: false })
    await seed({ coachId: COACH_B, name: 'Other Coach Student' })

    const result = await repo.findAllByCoach(COACH_A)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Active Student')
  })
})

describe('StudentRepository.findById', () => {
  it('returns null for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    expect(await repo.findById(fakeId, COACH_A)).toBeNull()
  })

  it('returns null when student belongs to a different coach', async () => {
    const student = await seed()
    expect(await repo.findById(student._id.toString(), COACH_B)).toBeNull()
  })

  it('returns the student when id and coachId match', async () => {
    const student = await seed({ name: 'Jane' })
    const found = await repo.findById(student._id.toString(), COACH_A)
    expect(found?.name).toBe('Jane')
  })
})

describe('StudentRepository.create', () => {
  it('creates and returns a student with coachId', async () => {
    const student = await repo.create({
      coachId: COACH_A,
      name: 'New Student',
      skillLevel: 'intermediate',
    })
    expect(student.name).toBe('New Student')
    expect(student.coachId.toString()).toBe(COACH_A)
    expect(student.isActive).toBe(true)
  })
})

describe('StudentRepository.update', () => {
  it('returns null when student not found or wrong coach', async () => {
    const student = await seed()
    expect(await repo.update(student._id.toString(), COACH_B, { name: 'Hacked' })).toBeNull()
  })

  it('updates and returns the updated student', async () => {
    const student = await seed()
    const updated = await repo.update(student._id.toString(), COACH_A, {
      name: 'Updated Name',
      skillLevel: 'advanced',
    })
    expect(updated?.name).toBe('Updated Name')
    expect(updated?.skillLevel).toBe('advanced')
  })
})

describe('StudentRepository.archive', () => {
  it('returns null when student not found or wrong coach', async () => {
    const student = await seed()
    expect(await repo.archive(student._id.toString(), COACH_B)).toBeNull()
  })

  it('sets isActive to false', async () => {
    const student = await seed()
    await repo.archive(student._id.toString(), COACH_A)
    const found = await Student.findById(student._id)
    expect(found?.isActive).toBe(false)
  })
})

describe('StudentRepository.countActiveByCoach', () => {
  it('returns 0 when coach has no active students', async () => {
    expect(await repo.countActiveByCoach(COACH_A)).toBe(0)
  })

  it('counts only active students for the given coach', async () => {
    await seed()
    await seed()
    await seed({ isActive: false })
    await seed({ coachId: COACH_B })

    expect(await repo.countActiveByCoach(COACH_A)).toBe(2)
  })
})
