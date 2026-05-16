import { CoachProfile, ICoachProfile } from '../coach-profile/coach-profile.model'

type Filters = {
  specialization?: string
  city?: string
  sessionType?: string
}

type FindAllParams = {
  filters: Filters
  page: number
  limit: number
}

type FindAllResult = {
  coaches: ICoachProfile[]
  total: number
}

export interface IPublicCoachesRepository {
  findAll(params: FindAllParams): Promise<FindAllResult>
  findBySlug(slug: string): Promise<ICoachProfile | null>
  incrementViews(slug: string): Promise<void>
}

export class PublicCoachesRepository implements IPublicCoachesRepository {
  async findAll({ filters, page, limit }: FindAllParams): Promise<FindAllResult> {
    const query: Record<string, unknown> = { isPublic: true }
    if (filters.specialization) query.specializations = filters.specialization
    if (filters.city) query.city = { $regex: filters.city, $options: 'i' }
    if (filters.sessionType) query.sessionTypes = filters.sessionType

    const [coaches, total] = await Promise.all([
      CoachProfile.find(query)
        .sort({ totalViews: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      CoachProfile.countDocuments(query),
    ])
    return { coaches, total }
  }

  async findBySlug(slug: string): Promise<ICoachProfile | null> {
    return CoachProfile.findOne({ slug, isPublic: true })
  }

  async incrementViews(slug: string): Promise<void> {
    await CoachProfile.updateOne({ slug }, { $inc: { totalViews: 1 } })
  }
}
