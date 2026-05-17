import type { Request, Response, NextFunction } from 'express'
import type { SubscriptionService } from './subscription.service'

export class SubscriptionController {
  constructor(private service: SubscriptionService) {}

  getMySubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getMySubscription(req.user!.userId)
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  }
}
