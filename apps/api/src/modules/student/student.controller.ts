import type { Request, Response, NextFunction } from 'express'
import { createStudentSchema, updateStudentSchema } from '@picklecoach/shared'
import { StudentService } from './student.service'

export class StudentController {
  constructor(private service: StudentService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const students = await this.service.list(req.user!.userId)
      res.json({ success: true, data: students })
    } catch (err) {
      next(err)
    }
  }

  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await this.service.getOne(req.user!.userId, req.params.id)
      res.json({ success: true, data: student })
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createStudentSchema.parse(req.body)
      const student = await this.service.create(req.user!.userId, input)
      res.status(201).json({ success: true, data: student })
    } catch (err) {
      next(err)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateStudentSchema.parse(req.body)
      const student = await this.service.update(req.user!.userId, req.params.id, input)
      res.json({ success: true, data: student })
    } catch (err) {
      next(err)
    }
  }

  archive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.archive(req.user!.userId, req.params.id)
      res.json({ success: true, data: { message: 'Student archived' } })
    } catch (err) {
      next(err)
    }
  }
}
