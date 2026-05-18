import { v2 as cloudinary } from 'cloudinary'
import type { Request, Response, NextFunction } from 'express'
import { updateGcashSettingsSchema } from '@picklecoach/shared'
import type { PlatformSettingsRepository } from './platform-settings.repository'
import { env } from '../../config/env'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

function uploadQrToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'picklecoach/settings', resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

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
      const { number, name } = updateGcashSettingsSchema.parse(req.body)

      let qrUrl: string | undefined = (req.body.qrUrl as string) || undefined
      if (req.file) {
        qrUrl = await uploadQrToCloudinary(req.file.buffer)
      }

      await this.repo.upsertGcash({ number, name, qrUrl })
      res.json({ success: true, data: { message: 'GCash settings updated' } })
    } catch (err) {
      next(err)
    }
  }
}
