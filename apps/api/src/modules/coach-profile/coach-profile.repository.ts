import { CoachProfile, ICoachProfile } from './coach-profile.model'

type CreateData = {
  coachId: string
  slug: string
  displayName: string
}

type UpdateData = {
  displayName?: string
  bio?: string
  city?: string
  specializations?: string[]
  sessionTypes?: ('private' | 'group')[]
  privateRate?: number
  groupRate?: number
  ratesNote?: string
  contactEmail?: string
  contactPhone?: string
  showContactInfo?: boolean
  isPublic?: boolean
}

export interface ICoachProfileRepository {
  create(data: CreateData): Promise<ICoachProfile>
  findByCoachId(coachId: string): Promise<ICoachProfile | null>
  findBySlug(slug: string): Promise<ICoachProfile | null>
  update(coachId: string, data: UpdateData): Promise<ICoachProfile | null>
  updatePhoto(coachId: string, photoUrl: string): Promise<ICoachProfile | null>
}

export class CoachProfileRepository implements ICoachProfileRepository {
  async create(data: CreateData): Promise<ICoachProfile> {
    return CoachProfile.create(data)
  }

  async findByCoachId(coachId: string): Promise<ICoachProfile | null> {
    return CoachProfile.findOne({ coachId })
  }

  async findBySlug(slug: string): Promise<ICoachProfile | null> {
    return CoachProfile.findOne({ slug })
  }

  async update(coachId: string, data: UpdateData): Promise<ICoachProfile | null> {
    return CoachProfile.findOneAndUpdate({ coachId }, { $set: data }, { new: true })
  }

  async updatePhoto(coachId: string, photoUrl: string): Promise<ICoachProfile | null> {
    return CoachProfile.findOneAndUpdate({ coachId }, { $set: { photoUrl } }, { new: true })
  }
}
