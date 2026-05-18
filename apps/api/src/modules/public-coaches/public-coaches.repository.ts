import mongoose, { PipelineStage } from 'mongoose'
import { CoachProfile } from '../coach-profile/coach-profile.model'

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

export type CoachListItem = {
  _id: mongoose.Types.ObjectId
  coachId: mongoose.Types.ObjectId
  slug: string
  isPublic: boolean
  displayName: string
  bio?: string
  photoUrl?: string
  city?: string
  specializations: string[]
  sessionTypes: ('private' | 'group')[]
  privateRate?: number
  groupRate?: number
  ratesNote?: string
  contactEmail?: string
  contactPhone?: string
  showContactInfo: boolean
  totalViews: number
  ageGroups: string[]
  languages: string[]
  socialLinks?: { facebook?: string; instagram?: string; youtube?: string }
  coachingPhilosophy?: string
  subscriptionTier: string
}

type FindAllResult = {
  coaches: CoachListItem[]
  total: number
}

export interface IPublicCoachesRepository {
  findAll(params: FindAllParams): Promise<FindAllResult>
  findBySlug(slug: string): Promise<CoachListItem | null>
  incrementViews(slug: string): Promise<void>
  findAllPublicSlugs(): Promise<string[]>
}

function buildBasePipeline(match: Record<string, unknown>): PipelineStage[] {
  return [
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'coachId',
        foreignField: '_id',
        as: '_user',
      },
    },
    {
      $addFields: {
        subscriptionTier: {
          $ifNull: [{ $arrayElemAt: ['$_user.subscriptionTier', 0] }, 'starter'],
        },
        _isPro: {
          $in: [
            { $ifNull: [{ $arrayElemAt: ['$_user.subscriptionTier', 0] }, 'starter'] },
            ['pro', 'team'],
          ],
        },
      },
    },
    { $sort: { _isPro: -1, totalViews: -1 } } as PipelineStage,
    { $project: { _user: 0, _isPro: 0 } },
  ]
}

export class PublicCoachesRepository implements IPublicCoachesRepository {
  async findAll({ filters, page, limit }: FindAllParams): Promise<FindAllResult> {
    const match: Record<string, unknown> = { isPublic: true }
    if (filters.specialization) match.specializations = filters.specialization
    if (filters.city) match.city = { $regex: filters.city, $options: 'i' }
    if (filters.sessionType) match.sessionTypes = filters.sessionType

    const base = buildBasePipeline(match)

    const [coaches, countResult] = await Promise.all([
      CoachProfile.aggregate<CoachListItem>([
        ...base,
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]),
      CoachProfile.aggregate([...base, { $count: 'total' }]),
    ])

    const total = countResult[0]?.total ?? 0
    return { coaches, total }
  }

  async findBySlug(slug: string): Promise<CoachListItem | null> {
    const results = await CoachProfile.aggregate<CoachListItem>([
      { $match: { slug, isPublic: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'coachId',
          foreignField: '_id',
          as: '_user',
        },
      },
      {
        $addFields: {
          subscriptionTier: {
            $ifNull: [{ $arrayElemAt: ['$_user.subscriptionTier', 0] }, 'starter'],
          },
        },
      },
      { $project: { _user: 0 } },
      { $limit: 1 },
    ])
    return results[0] ?? null
  }

  async incrementViews(slug: string): Promise<void> {
    await CoachProfile.updateOne({ slug }, { $inc: { totalViews: 1 } })
  }

  async findAllPublicSlugs(): Promise<string[]> {
    const docs = await CoachProfile.find({ isPublic: true }).select('slug').lean()
    return docs.map((d) => d.slug)
  }
}
