import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { RegisterInput, LoginInput, UserRole } from '@picklecoach/shared'
import type { IAuthRepository } from './auth.repository'
import type { IUser } from './auth.model'
import { createError } from '../../middleware/error.middleware'
import { env } from '../../config/env'

export interface JwtPayload {
  userId: string
  role: UserRole
}

type PublicUser = Pick<
  IUser,
  '_id' | 'name' | 'email' | 'role' | 'subscriptionTier' | 'subscriptionStatus'
>

export interface AuthResult {
  user: PublicUser
  token: string
}

export class AuthService {
  constructor(private repo: IAuthRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const exists = await this.repo.emailExists(input.email)
    if (exists) throw createError('Email already in use', 409, 'EMAIL_TAKEN')

    const passwordHash = await bcrypt.hash(input.password, 12)
    const user = await this.repo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
    })

    return { user: this.sanitize(user), token: this.signToken(user) }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.repo.findByEmail(input.email)
    if (!user) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS')

    const valid = await user.comparePassword(input.password)
    if (!valid) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS')

    return { user: this.sanitize(user), token: this.signToken(user) }
  }

  async getById(id: string): Promise<PublicUser> {
    const user = await this.repo.findById(id)
    if (!user) throw createError('User not found', 404, 'USER_NOT_FOUND')
    return this.sanitize(user)
  }

  private signToken(user: IUser): string {
    const payload: JwtPayload = { userId: user._id.toString(), role: user.role }
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    })
  }

  private sanitize(user: IUser): PublicUser {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
    }
  }
}
