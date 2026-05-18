import type { Request, Response, NextFunction } from 'express'
import { updateCoachSubscriptionSchema } from '@picklecoach/shared'
import type { SubscriptionStatus, SubscriptionTier } from '@picklecoach/shared'
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

  listCoaches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tier, status } = req.query as { tier?: string; status?: string }
      const coaches = await this.repo.listCoaches({
        tier: tier as SubscriptionTier | undefined,
        status: status as SubscriptionStatus | undefined,
      })
      res.json({ success: true, data: coaches })
    } catch (err) {
      next(err)
    }
  }

  getCoachDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const detail = await this.repo.getCoachDetail(req.params.id)
      if (!detail) {
        res
          .status(404)
          .json({ success: false, error: { code: 'COACH_NOT_FOUND', message: 'Coach not found' } })
        return
      }
      res.json({ success: true, data: detail })
    } catch (err) {
      next(err)
    }
  }

  listExpiringCoaches = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.repo.listExpiringCoaches()
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  }

  listChurnedCoaches = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.repo.listChurnedCoaches()
      res.json({ success: true, data })
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
