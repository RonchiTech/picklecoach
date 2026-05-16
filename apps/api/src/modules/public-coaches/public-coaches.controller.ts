import type { Request, Response, NextFunction } from 'express'
import { PublicCoachesService } from './public-coaches.service'

export class PublicCoachesController {
  constructor(private service: PublicCoachesService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = {
        specialization: req.query.specialization as string | undefined,
        city: req.query.city as string | undefined,
        sessionType: req.query.sessionType as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
      }
      const result = await this.service.listCoaches(query)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coach = await this.service.getCoachBySlug(req.params.slug)
      res.json({ success: true, data: coach })
    } catch (err) {
      next(err)
    }
  }
}
