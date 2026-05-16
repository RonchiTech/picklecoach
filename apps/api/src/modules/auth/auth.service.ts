import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type {
  RegisterInput,
  LoginInput,
  UserRole,
  PublicUser,
  UpdateProfileInput,
  UpdatePasswordInput,
} from '@picklecoach/shared'
import type { IAuthRepository } from './auth.repository'
import type { IUser } from './auth.model'
import { createError } from '../../middleware/error.middleware'
import { env } from '../../config/env'

export interface JwtPayload {
  userId: string
  role: UserRole
}

export interface AuthResult {
  user: PublicUser
  token: string
}

type OnRegisterFn = (userId: string, name: string) => Promise<void>

export class AuthService {
  constructor(
    private repo: IAuthRepository,
    private onRegister: OnRegisterFn = async () => {}
  ) {}

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

    await this.onRegister(user._id.toString(), user.name)

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

  async updateProfile(id: string, input: UpdateProfileInput): Promise<PublicUser> {
    const user = await this.repo.update(id, input)
    if (!user) throw createError('User not found', 404, 'USER_NOT_FOUND')
    return this.sanitize(user)
  }

  async changePassword(id: string, input: UpdatePasswordInput): Promise<void> {
    const user = await this.repo.findById(id)
    if (!user) throw createError('User not found', 404, 'USER_NOT_FOUND')

    const valid = await user.comparePassword(input.currentPassword)
    if (!valid) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS')

    const passwordHash = await bcrypt.hash(input.newPassword, 12)
    await this.repo.updatePassword(id, passwordHash)
  }

  private signToken(user: IUser): string {
    const payload: JwtPayload = { userId: user._id.toString(), role: user.role }
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    })
  }

  private sanitize(user: IUser): PublicUser {
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
    }
  }
}
