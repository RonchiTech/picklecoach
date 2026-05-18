import type { CoachDirectoryQuery, CoachDirectoryResult } from '@picklecoach/shared'
import type { IPublicCoachesRepository, CoachListItem } from './public-coaches.repository'
import { createError } from '../../middleware/error.middleware'

export class PublicCoachesService {
  constructor(private repo: IPublicCoachesRepository) {}

  async listCoaches(query: CoachDirectoryQuery): Promise<CoachDirectoryResult> {
    const page = query.page ?? 1
    const limit = 12
    const { coaches, total } = await this.repo.findAll({
      filters: {
        specialization: query.specialization,
        city: query.city,
        sessionType: query.sessionType,
      },
      page,
      limit,
    })
    return {
      coaches: coaches as unknown as CoachDirectoryResult['coaches'],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getCoachBySlug(slug: string): Promise<CoachListItem> {
    const profile = await this.repo.findBySlug(slug)
    if (!profile) throw createError('Coach not found', 404, 'COACH_NOT_FOUND')
    await this.repo.incrementViews(slug)
    return profile
  }

  async listSlugs(): Promise<string[]> {
    return this.repo.findAllPublicSlugs()
  }
}
