import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { resend } from '../../config/resend'
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
import { Student } from '../student/student.model'
import { Session } from '../session/session.model'
import { Payment } from '../payment/payment.model'
import { ProgressEntry } from '../progress-entry/progress-entry.model'
import { CoachProfile } from '../coach-profile/coach-profile.model'
import { UpgradeRequest } from '../upgrade-request/upgrade-request.model'
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

  async setGoal(id: string, monthlyGoal: number): Promise<PublicUser> {
    const user = await this.repo.updateGoal(id, monthlyGoal)
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

  async forgotPassword(email: string): Promise<void> {
    const user = await this.repo.findByEmail(email)
    if (!user) return

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await this.repo.setResetToken(user._id.toString(), tokenHash, expiresAt)

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'Reset your PickleCoach password',
      html: `<p>Hi ${user.name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p><p>If you did not request this, ignore this email.</p>`,
    })
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const user = await this.repo.findByResetToken(tokenHash)

    if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
      throw createError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN')
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await this.repo.updatePassword(user._id.toString(), passwordHash)
    await this.repo.clearResetToken(user._id.toString())
  }

  async deleteAccount(userId: string): Promise<void> {
    await Promise.all([
      Student.deleteMany({ coachId: userId }),
      Session.deleteMany({ coachId: userId }),
      Payment.deleteMany({ coachId: userId }),
      ProgressEntry.deleteMany({ coachId: userId }),
      CoachProfile.deleteOne({ coachId: userId }),
      UpgradeRequest.deleteMany({ coachId: userId }),
    ])
    await this.repo.deleteById(userId)
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
      proEndsAt: user.proEndsAt?.toISOString(),
      monthlyGoal: user.monthlyGoal,
    }
  }
}
