import type { Request, Response, NextFunction } from 'express'
import { registerSchema, loginSchema } from '@picklecoach/shared'
import { AuthService } from './auth.service'
import { env } from '../../config/env'

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export class AuthController {
  constructor(private service: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = registerSchema.parse(req.body)
      const result = await this.service.register(input)
      res.cookie('token', result.token, COOKIE_OPTIONS)
      res.status(201).json({ success: true, data: result.user })
    } catch (err) {
      next(err)
    }
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = loginSchema.parse(req.body)
      const result = await this.service.login(input)
      res.cookie('token', result.token, COOKIE_OPTIONS)
      res.json({ success: true, data: result.user })
    } catch (err) {
      next(err)
    }
  }

  logout = (_req: Request, res: Response): void => {
    res.clearCookie('token')
    res.json({ success: true, data: { message: 'Logged out' } })
  }

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.getById(req.user!.userId)
      res.json({ success: true, data: user })
    } catch (err) {
      next(err)
    }
  }
}
