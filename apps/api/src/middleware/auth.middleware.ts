import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { UserRole } from '@picklecoach/shared'
import { env } from '../config/env'
import { createError } from './error.middleware'
import type { JwtPayload } from '../modules/auth/auth.service'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined
  if (!token) return next(createError('Not authenticated', 401, 'NOT_AUTHENTICATED'))

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    next(createError('Invalid or expired token', 401, 'INVALID_TOKEN'))
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(createError('Not authenticated', 401, 'NOT_AUTHENTICATED'))
    if (!roles.includes(req.user.role)) return next(createError('Forbidden', 403, 'FORBIDDEN'))
    next()
  }
}
