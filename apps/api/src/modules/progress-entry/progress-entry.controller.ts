import type { Request, Response, NextFunction } from 'express'
import { createProgressEntrySchema, updateProgressEntrySchema } from '@picklecoach/shared'
import { ProgressEntryService } from './progress-entry.service'

export class ProgressEntryController {
  constructor(private service: ProgressEntryService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.query as { studentId?: string }
      if (!studentId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'studentId query param is required' },
        })
        return
      }
      const entries = await this.service.list(req.user!.userId, studentId)
      res.json({ success: true, data: entries })
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createProgressEntrySchema.parse(req.body)
      const entry = await this.service.create(req.user!.userId, input)
      res.status(201).json({ success: true, data: entry })
    } catch (err) {
      next(err)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateProgressEntrySchema.parse(req.body)
      const entry = await this.service.update(req.user!.userId, req.params.id, input)
      res.json({ success: true, data: entry })
    } catch (err) {
      next(err)
    }
  }

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.user!.userId, req.params.id)
      res.json({ success: true, data: { message: 'Entry deleted' } })
    } catch (err) {
      next(err)
    }
  }
}
