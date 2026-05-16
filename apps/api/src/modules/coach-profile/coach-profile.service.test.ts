import { CoachProfileService } from './coach-profile.service'
import type { ICoachProfileRepository } from './coach-profile.repository'
import type { ICoachProfile } from './coach-profile.model'

const mockProfile = {
  _id: { toString: () => '507f1f77bcf86cd799439011' },
  coachId: { toString: () => '507f1f77bcf86cd799439012' },
  slug: 'coach-ron-a1b2',
  isPublic: false,
  displayName: 'Coach Ron',
  specializations: [],
  sessionTypes: [],
  showContactInfo: false,
  totalViews: 0,
} as unknown as ICoachProfile

const mockRepo: jest.Mocked<ICoachProfileRepository> = {
  create: jest.fn(),
  findByCoachId: jest.fn(),
  findBySlug: jest.fn(),
  update: jest.fn(),
  updatePhoto: jest.fn(),
}

let service: CoachProfileService

beforeEach(() => {
  jest.clearAllMocks()
  service = new CoachProfileService(mockRepo)
})

describe('CoachProfileService.getMyProfile', () => {
  it('throws PROFILE_NOT_FOUND when profile does not exist', async () => {
    mockRepo.findByCoachId.mockResolvedValue(null)
    await expect(service.getMyProfile('coach-id')).rejects.toMatchObject({
      code: 'PROFILE_NOT_FOUND',
      statusCode: 404,
    })
  })

  it('returns the profile when found', async () => {
    mockRepo.findByCoachId.mockResolvedValue(mockProfile)
    const result = await service.getMyProfile('coach-id')
    expect(result.slug).toBe('coach-ron-a1b2')
  })
})

describe('CoachProfileService.createForCoach', () => {
  it('calls repo.findBySlug until a unique slug is found, then creates', async () => {
    mockRepo.findBySlug.mockResolvedValueOnce(mockProfile) // first slug taken
    mockRepo.findBySlug.mockResolvedValueOnce(null) // second slug free
    mockRepo.create.mockResolvedValue(mockProfile)
    await service.createForCoach('coach-id', 'Coach Ron')
    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(2)
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ coachId: 'coach-id', displayName: 'Coach Ron' })
    )
  })

  it('throws SLUG_GENERATION_FAILED after 5 collisions', async () => {
    mockRepo.findBySlug.mockResolvedValue(mockProfile) // always taken
    await expect(service.createForCoach('coach-id', 'Coach Ron')).rejects.toMatchObject({
      code: 'SLUG_GENERATION_FAILED',
      statusCode: 500,
    })
    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(5)
    expect(mockRepo.create).not.toHaveBeenCalled()
  })
})

describe('CoachProfileService.updateProfile', () => {
  it('throws PROFILE_NOT_FOUND when repo.update returns null', async () => {
    mockRepo.update.mockResolvedValue(null)
    await expect(service.updateProfile('coach-id', { displayName: 'New' })).rejects.toMatchObject({
      code: 'PROFILE_NOT_FOUND',
      statusCode: 404,
    })
  })

  it('returns the updated profile', async () => {
    const updated = { ...mockProfile, displayName: 'New Name' } as unknown as ICoachProfile
    mockRepo.update.mockResolvedValue(updated)
    const result = await service.updateProfile('coach-id', { displayName: 'New Name' })
    expect(result.displayName).toBe('New Name')
    expect(mockRepo.update).toHaveBeenCalledWith('coach-id', { displayName: 'New Name' })
  })
})

jest.mock('../../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: jest.fn(
        (_opts: unknown, cb: (err: null, result: { secure_url: string }) => void) => {
          cb(null, { secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg' })
          return { end: jest.fn() }
        }
      ),
    },
  },
}))

describe('CoachProfileService.uploadPhoto', () => {
  it('throws PROFILE_NOT_FOUND when repo.updatePhoto returns null', async () => {
    mockRepo.updatePhoto.mockResolvedValue(null)
    const buffer = Buffer.from('fake-image')
    await expect(service.uploadPhoto('coach-id', buffer)).rejects.toMatchObject({
      code: 'PROFILE_NOT_FOUND',
      statusCode: 404,
    })
  })

  it('uploads to Cloudinary and updates the profile photoUrl', async () => {
    const updated = {
      ...mockProfile,
      photoUrl: 'https://res.cloudinary.com/test/image/upload/test.jpg',
    } as unknown as ICoachProfile
    mockRepo.updatePhoto.mockResolvedValue(updated)
    const buffer = Buffer.from('fake-image')
    const result = await service.uploadPhoto('coach-id', buffer)
    expect(result.photoUrl).toBe('https://res.cloudinary.com/test/image/upload/test.jpg')
    expect(mockRepo.updatePhoto).toHaveBeenCalledWith(
      'coach-id',
      'https://res.cloudinary.com/test/image/upload/test.jpg'
    )
  })
})
