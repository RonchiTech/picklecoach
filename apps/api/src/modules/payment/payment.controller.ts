import type { Request, Response, NextFunction } from 'express'
import { createPaymentSchema, updatePaymentSchema } from '@picklecoach/shared'
import { PaymentService } from './payment.service'

export class PaymentController {
  constructor(private service: PaymentService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
      const result = await this.service.list(req.user!.userId, page, limit)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await this.service.getOne(req.user!.userId, req.params.id)
      res.json({ success: true, data: payment })
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createPaymentSchema.parse(req.body)
      const payment = await this.service.create(req.user!.userId, input)
      res.status(201).json({ success: true, data: payment })
    } catch (err) {
      next(err)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updatePaymentSchema.parse(req.body)
      const payment = await this.service.update(req.user!.userId, req.params.id, input)
      res.json({ success: true, data: payment })
    } catch (err) {
      next(err)
    }
  }

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.user!.userId, req.params.id)
      res.json({ success: true, data: null })
    } catch (err) {
      next(err)
    }
  }
}
