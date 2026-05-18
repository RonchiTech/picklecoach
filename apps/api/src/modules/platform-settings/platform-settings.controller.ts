import type { Request, Response, NextFunction } from 'express'
import { updateGcashSettingsSchema } from '@picklecoach/shared'
import type { PlatformSettingsRepository } from './platform-settings.repository'

export class PlatformSettingsController {
  constructor(private repo: PlatformSettingsRepository) {}

  getGcash = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await this.repo.getGcash()
      res.json({ success: true, data: settings })
    } catch (err) {
      next(err)
    }
  }

  updateGcash = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateGcashSettingsSchema.parse(req.body)
      await this.repo.upsertGcash(input)
      res.json({ success: true, data: { message: 'GCash settings updated' } })
    } catch (err) {
      next(err)
    }
  }
}
