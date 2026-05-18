import type { Request, Response, NextFunction } from 'express'
import { submitUpgradeRequestSchema, reviewUpgradeRequestSchema } from '@picklecoach/shared'
import type { UpgradeRequestService } from './upgrade-request.service'
import { createError } from '../../middleware/error.middleware'

export class UpgradeRequestController {
  constructor(private service: UpgradeRequestService) {}

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { months, promoCode } = submitUpgradeRequestSchema.parse(req.body)
      const file = req.file
      if (!file) return next(createError('Receipt image is required', 400, 'RECEIPT_REQUIRED'))

      const result = await this.service.submit({
        coachId: req.user!.userId,
        months,
        promoCode,
        receiptBuffer: file.buffer,
      })
      res.status(201).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  getMine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getMine(req.user!.userId)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  listAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requests = await this.service.listAll()
      res.json({ success: true, data: requests })
    } catch (err) {
      next(err)
    }
  }

  review = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { action, notes } = reviewUpgradeRequestSchema.parse(req.body)
      if (action === 'approved') {
        await this.service.approve(req.params.id, req.user!.userId, notes)
      } else {
        await this.service.reject(req.params.id, req.user!.userId, notes)
      }
      res.json({ success: true, data: { message: `Request ${action}` } })
    } catch (err) {
      next(err)
    }
  }
}
