import { ProgressEntryService } from './progress-entry.service'
import type { IProgressEntryRepository } from './progress-entry.repository'
import type { IProgressEntry } from './progress-entry.model'
import mongoose from 'mongoose'

const COACH_ID = 'coach-123'
const STUDENT_ID = new mongoose.Types.ObjectId().toString()
const ENTRY_ID = new mongoose.Types.ObjectId().toString()

const mockEntry = {
  _id: { toString: () => ENTRY_ID },
  coachId: { toString: () => COACH_ID },
  studentId: { toString: () => STUDENT_ID },
  type: 'general',
  content: 'Good session',
  skillTags: [],
} as unknown as IProgressEntry

const mockRepo: jest.Mocked<IProgressEntryRepository> = {
  findByStudent: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

let service: ProgressEntryService

beforeEach(() => {
  jest.clearAllMocks()
  service = new ProgressEntryService(mockRepo)
})

describe('ProgressEntryService.list', () => {
  it('returns entries for the given coach and student', async () => {
    mockRepo.findByStudent.mockResolvedValue([mockEntry])
    const result = await service.list(COACH_ID, STUDENT_ID)
    expect(result).toHaveLength(1)
    expect(mockRepo.findByStudent).toHaveBeenCalledWith(COACH_ID, STUDENT_ID)
  })
})

describe('ProgressEntryService.create', () => {
  it('calls repo.create with coachId and returns entry', async () => {
    mockRepo.create.mockResolvedValue(mockEntry)
    const result = await service.create(COACH_ID, {
      studentId: STUDENT_ID,
      type: 'goal',
      content: 'Work on dinking',
      skillTags: ['dinking'],
    })
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        coachId: COACH_ID,
        studentId: STUDENT_ID,
        content: 'Work on dinking',
      })
    )
    expect(result.content).toBe('Good session')
  })

  it('passes skillTags and type through to repo', async () => {
    mockRepo.create.mockResolvedValue(mockEntry)
    await service.create(COACH_ID, {
      studentId: STUDENT_ID,
      type: 'general',
      content: 'Note',
      skillTags: ['footwork'],
    })
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'general', skillTags: ['footwork'] })
    )
  })
})

describe('ProgressEntryService.update', () => {
  it('throws ENTRY_NOT_FOUND when entry does not exist', async () => {
    mockRepo.update.mockResolvedValue(null)
    await expect(service.update(COACH_ID, ENTRY_ID, { content: 'New' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'ENTRY_NOT_FOUND',
    })
  })

  it('returns the updated entry', async () => {
    const updated = { ...mockEntry, content: 'Updated' } as unknown as IProgressEntry
    mockRepo.update.mockResolvedValue(updated)
    const result = await service.update(COACH_ID, ENTRY_ID, { content: 'Updated' })
    expect(result.content).toBe('Updated')
  })
})

describe('ProgressEntryService.delete', () => {
  it('throws ENTRY_NOT_FOUND when entry does not exist or wrong coach', async () => {
    mockRepo.delete.mockResolvedValue(false)
    await expect(service.delete(COACH_ID, ENTRY_ID)).rejects.toMatchObject({
      statusCode: 404,
      code: 'ENTRY_NOT_FOUND',
    })
  })

  it('resolves without error when delete succeeds', async () => {
    mockRepo.delete.mockResolvedValue(true)
    await expect(service.delete(COACH_ID, ENTRY_ID)).resolves.toBeUndefined()
  })
})
