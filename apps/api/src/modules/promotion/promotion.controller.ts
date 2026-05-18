import type { Request, Response, NextFunction } from 'express'
import {
  createPromotionSchema,
  updatePromotionSchema,
  validatePromoSchema,
} from '@picklecoach/shared'
import type { PromotionService } from './promotion.service'

export class PromotionController {
  constructor(private service: PromotionService) {}

  validate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, months } = validatePromoSchema.parse(req.body)
      const result = await this.service.validate(code, months)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const promos = await this.service.list()
      res.json({ success: true, data: promos })
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createPromotionSchema.parse(req.body)
      const promo = await this.service.create(input, req.user!.userId)
      res.status(201).json({ success: true, data: promo })
    } catch (err) {
      next(err)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updatePromotionSchema.parse(req.body)
      const promo = await this.service.update(req.params.id, input)
      res.json({ success: true, data: promo })
    } catch (err) {
      next(err)
    }
  }

  deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deactivate(req.params.id)
      res.json({ success: true, data: { message: 'Promotion deactivated' } })
    } catch (err) {
      next(err)
    }
  }

  listRedemptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.listRedemptions(req.params.id)
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  }
}
