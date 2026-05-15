import { StudentService } from './student.service'
import type { IStudentRepository } from './student.repository'
import type { IStudent } from './student.model'
import mongoose from 'mongoose'

const COACH_ID = 'coach-123'
const STUDENT_ID = new mongoose.Types.ObjectId().toString()

const mockStudent = {
  _id: { toString: () => STUDENT_ID },
  coachId: { toString: () => COACH_ID },
  name: 'John Doe',
  skillLevel: 'beginner',
  isActive: true,
} as unknown as IStudent

const mockRepo: jest.Mocked<IStudentRepository> = {
  findAllByCoach: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  archive: jest.fn(),
  countActiveByCoach: jest.fn(),
}

let service: StudentService

beforeEach(() => {
  jest.clearAllMocks()
  service = new StudentService(mockRepo)
})

describe('StudentService.list', () => {
  it('returns students for the given coach', async () => {
    mockRepo.findAllByCoach.mockResolvedValue([mockStudent])
    const result = await service.list(COACH_ID)
    expect(result).toHaveLength(1)
    expect(mockRepo.findAllByCoach).toHaveBeenCalledWith(COACH_ID)
  })
})

describe('StudentService.getOne', () => {
  it('throws STUDENT_NOT_FOUND when student does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null)
    await expect(service.getOne(COACH_ID, STUDENT_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'STUDENT_NOT_FOUND',
    })
  })

  it('returns the student when found', async () => {
    mockRepo.findById.mockResolvedValue(mockStudent)
    const result = await service.getOne(COACH_ID, STUDENT_ID)
    expect(result.name).toBe('John Doe')
  })
})

describe('StudentService.create', () => {
  it('calls repo.create with coachId and returns the student', async () => {
    mockRepo.create.mockResolvedValue(mockStudent)
    const result = await service.create(COACH_ID, { name: 'John Doe', skillLevel: 'beginner' })
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ coachId: COACH_ID, name: 'John Doe' })
    )
    expect(result.name).toBe('John Doe')
  })
})

describe('StudentService.update', () => {
  it('throws STUDENT_NOT_FOUND when student does not exist or wrong coach', async () => {
    mockRepo.update.mockResolvedValue(null)
    await expect(service.update(COACH_ID, STUDENT_ID, { name: 'New' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'STUDENT_NOT_FOUND',
    })
  })

  it('returns the updated student', async () => {
    const updated = { ...mockStudent, name: 'Updated' } as unknown as IStudent
    mockRepo.update.mockResolvedValue(updated)
    const result = await service.update(COACH_ID, STUDENT_ID, { name: 'Updated' })
    expect(result.name).toBe('Updated')
  })
})

describe('StudentService.archive', () => {
  it('throws STUDENT_NOT_FOUND when student does not exist or wrong coach', async () => {
    mockRepo.archive.mockResolvedValue(null)
    await expect(service.archive(COACH_ID, STUDENT_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'STUDENT_NOT_FOUND',
    })
  })

  it('resolves without error when archive succeeds', async () => {
    mockRepo.archive.mockResolvedValue(mockStudent)
    await expect(service.archive(COACH_ID, STUDENT_ID)).resolves.toBeUndefined()
  })
})
