import type { Request, Response, NextFunction } from 'express'
import { createSessionSchema, updateSessionSchema } from '@picklecoach/shared'
import { SessionService } from './session.service'

export class SessionController {
  constructor(private service: SessionService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessions = await this.service.list(req.user!.userId)
      res.json({ success: true, data: sessions })
    } catch (err) {
      next(err)
    }
  }

  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.service.getOne(req.user!.userId, req.params.id)
      res.json({ success: true, data: session })
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createSessionSchema.parse(req.body)
      const session = await this.service.create(req.user!.userId, input)
      res.status(201).json({ success: true, data: session })
    } catch (err) {
      next(err)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateSessionSchema.parse(req.body)
      const session = await this.service.update(req.user!.userId, req.params.id, input)
      res.json({ success: true, data: session })
    } catch (err) {
      next(err)
    }
  }
}
