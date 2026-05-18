import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import type { UserRole, SubscriptionTier, SubscriptionStatus } from '@picklecoach/shared'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  passwordHash: string
  role: UserRole
  phone?: string
  subscriptionTier: SubscriptionTier
  subscriptionStatus: SubscriptionStatus
  proEndsAt?: Date
  isPublic: boolean
  city?: string
  bio?: string
  profilePhoto?: string
  resetPasswordToken?: string
  resetPasswordExpiresAt?: Date
  comparePassword(candidate: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['coach', 'super_admin'], default: 'coach' },
    phone: { type: String },
    subscriptionTier: { type: String, enum: ['starter', 'pro', 'team'], default: 'starter' },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    proEndsAt: { type: Date },
    isPublic: { type: Boolean, default: true },
    city: { type: String },
    bio: { type: String },
    profilePhoto: { type: String },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
)

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash as string)
}

export const User = mongoose.model<IUser>('User', userSchema)
