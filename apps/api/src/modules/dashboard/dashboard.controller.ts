import type { Request, Response, NextFunction } from 'express'
import { DashboardService } from './dashboard.service'

export class DashboardController {
  constructor(private service: DashboardService) {}

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getStats(req.user!.userId)
      res.json({ success: true, data: stats })
    } catch (err) {
      next(err)
    }
  }
}
