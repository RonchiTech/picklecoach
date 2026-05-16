import { PublicCoachesService } from './public-coaches.service'
import type { IPublicCoachesRepository } from './public-coaches.repository'
import type { ICoachProfile } from '../coach-profile/coach-profile.model'

const mockProfile = {
  _id: { toString: () => '507f1f77bcf86cd799439011' },
  slug: 'coach-ron-a1b2',
  displayName: 'Coach Ron',
  isPublic: true,
  totalViews: 5,
} as unknown as ICoachProfile

const mockRepo: jest.Mocked<IPublicCoachesRepository> = {
  findAll: jest.fn(),
  findBySlug: jest.fn(),
  incrementViews: jest.fn(),
}

let service: PublicCoachesService

beforeEach(() => {
  jest.clearAllMocks()
  service = new PublicCoachesService(mockRepo)
})

describe('PublicCoachesService.listCoaches', () => {
  it('passes filters to repo and returns correct shape', async () => {
    mockRepo.findAll.mockResolvedValue({ coaches: [mockProfile], total: 1 })
    const result = await service.listCoaches({ specialization: 'dinking', city: 'Manila', page: 1 })
    expect(mockRepo.findAll).toHaveBeenCalledWith({
      filters: { specialization: 'dinking', city: 'Manila', sessionType: undefined },
      page: 1,
      limit: 12,
    })
    expect(result.coaches).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(1)
  })

  it('defaults to page 1 when page is not provided', async () => {
    mockRepo.findAll.mockResolvedValue({ coaches: [], total: 0 })
    const result = await service.listCoaches({})
    expect(mockRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
    expect(result.page).toBe(1)
  })

  it('calculates totalPages correctly for 25 results', async () => {
    mockRepo.findAll.mockResolvedValue({ coaches: [], total: 25 })
    const result = await service.listCoaches({ page: 1 })
    expect(result.totalPages).toBe(3)
  })
})

describe('PublicCoachesService.getCoachBySlug', () => {
  it('throws COACH_NOT_FOUND (404) when profile is null', async () => {
    mockRepo.findBySlug.mockResolvedValue(null)
    await expect(service.getCoachBySlug('unknown-slug')).rejects.toMatchObject({
      code: 'COACH_NOT_FOUND',
      statusCode: 404,
    })
  })

  it('calls incrementViews after finding the profile', async () => {
    mockRepo.findBySlug.mockResolvedValue(mockProfile)
    mockRepo.incrementViews.mockResolvedValue(undefined)
    await service.getCoachBySlug('coach-ron-a1b2')
    expect(mockRepo.incrementViews).toHaveBeenCalledWith('coach-ron-a1b2')
  })

  it('returns the profile', async () => {
    mockRepo.findBySlug.mockResolvedValue(mockProfile)
    mockRepo.incrementViews.mockResolvedValue(undefined)
    const result = await service.getCoachBySlug('coach-ron-a1b2')
    expect(result.displayName).toBe('Coach Ron')
  })

  it('does not call incrementViews when profile is not found', async () => {
    mockRepo.findBySlug.mockResolvedValue(null)
    await expect(service.getCoachBySlug('ghost')).rejects.toThrow()
    expect(mockRepo.incrementViews).not.toHaveBeenCalled()
  })
})
