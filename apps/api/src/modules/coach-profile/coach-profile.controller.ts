import type { Request, Response, NextFunction } from 'express'
import { updateCoachProfileSchema } from '@picklecoach/shared'
import { CoachProfileService } from './coach-profile.service'
import { createError } from '../../middleware/error.middleware'

export class CoachProfileController {
  constructor(private service: CoachProfileService) {}

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.service.getMyProfile(req.user!.userId)
      res.json({ success: true, data: profile })
    } catch (err) {
      next(err)
    }
  }

  updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateCoachProfileSchema.parse(req.body)
      const profile = await this.service.updateProfile(req.user!.userId, input)
      res.json({ success: true, data: profile })
    } catch (err) {
      next(err)
    }
  }

  uploadPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) throw createError('No file uploaded', 400, 'NO_FILE')
      const profile = await this.service.uploadPhoto(req.user!.userId, req.file.buffer)
      res.json({ success: true, data: { photoUrl: profile.photoUrl } })
    } catch (err) {
      next(err)
    }
  }
}
