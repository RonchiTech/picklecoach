import type { Request, Response, NextFunction } from 'express'
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updatePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@picklecoach/shared'
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

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateProfileSchema.parse(req.body)
      const user = await this.service.updateProfile(req.user!.userId, input)
      res.json({ success: true, data: user })
    } catch (err) {
      next(err)
    }
  }

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updatePasswordSchema.parse(req.body)
      await this.service.changePassword(req.user!.userId, input)
      res.json({ success: true, data: { message: 'Password updated' } })
    } catch (err) {
      next(err)
    }
  }

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body)
      await this.service.forgotPassword(email)
      res.json({
        success: true,
        data: { message: 'If that email is registered, a reset link has been sent.' },
      })
    } catch (err) {
      next(err)
    }
  }

  deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteAccount(req.user!.userId)
      res.clearCookie('token')
      res.json({ success: true, data: { message: 'Account deleted.' } })
    } catch (err) {
      next(err)
    }
  }

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body)
      await this.service.resetPassword(token, newPassword)
      res.json({ success: true, data: { message: 'Password updated successfully.' } })
    } catch (err) {
      next(err)
    }
  }
}
