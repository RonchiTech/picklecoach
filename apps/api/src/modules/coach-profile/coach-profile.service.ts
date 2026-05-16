import type { UpdateCoachProfileInput } from '@picklecoach/shared'
import type { ICoachProfileRepository } from './coach-profile.repository'
import type { ICoachProfile } from './coach-profile.model'
import { createError } from '../../middleware/error.middleware'
import { cloudinary } from '../../config/cloudinary'

export class CoachProfileService {
  constructor(private repo: ICoachProfileRepository) {}

  async getMyProfile(coachId: string): Promise<ICoachProfile> {
    const profile = await this.repo.findByCoachId(coachId)
    if (!profile) throw createError('Profile not found', 404, 'PROFILE_NOT_FOUND')
    return profile
  }

  async createForCoach(coachId: string, name: string): Promise<void> {
    const slug = await this.generateUniqueSlug(name)
    await this.repo.create({ coachId, slug, displayName: name })
  }

  async updateProfile(coachId: string, input: UpdateCoachProfileInput): Promise<ICoachProfile> {
    const profile = await this.repo.update(coachId, input)
    if (!profile) throw createError('Profile not found', 404, 'PROFILE_NOT_FOUND')
    return profile
  }

  async uploadPhoto(coachId: string, buffer: Buffer): Promise<ICoachProfile> {
    const photoUrl = await this.uploadToCloudinary(buffer)
    const profile = await this.repo.updatePhoto(coachId, photoUrl)
    if (!profile) throw createError('Profile not found', 404, 'PROFILE_NOT_FOUND')
    return profile
  }

  private uploadToCloudinary(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'picklecoach/profiles', resource_type: 'image' },
        (error: Error | undefined, result: { secure_url: string } | undefined) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'))
          resolve(result.secure_url)
        }
      )
      stream.end(buffer)
    })
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    for (let i = 0; i < 5; i++) {
      const suffix = Math.random().toString(36).slice(2, 6)
      const candidate = `${base}-${suffix}`
      const exists = await this.repo.findBySlug(candidate)
      if (!exists) return candidate
    }
    throw createError('Could not generate unique slug', 500, 'SLUG_GENERATION_FAILED')
  }
}
