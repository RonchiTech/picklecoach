import type { Request, Response, NextFunction } from 'express'
import { updateCoachSubscriptionSchema } from '@picklecoach/shared'
import type { AdminRepository } from './admin.repository'

export class AdminController {
  constructor(private repo: AdminRepository) {}

  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.repo.getStats()
      res.json({ success: true, data: stats })
    } catch (err) {
      next(err)
    }
  }

  listCoaches = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coaches = await this.repo.listCoaches()
      res.json({ success: true, data: coaches })
    } catch (err) {
      next(err)
    }
  }

  updateCoachSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tier, proEndsAt } = updateCoachSubscriptionSchema.parse(req.body)
      await this.repo.updateCoachSubscription(req.params.id, tier, proEndsAt)
      res.json({ success: true, data: { message: 'Subscription updated' } })
    } catch (err) {
      next(err)
    }
  }

  getRevenueSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.repo.getRevenueSummary()
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  }
}
