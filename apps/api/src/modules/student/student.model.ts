import mongoose, { Document, Schema } from 'mongoose'
import type { SkillLevel } from '@picklecoach/shared'

export interface IStudent extends Document {
  _id: mongoose.Types.ObjectId
  coachId: mongoose.Types.ObjectId
  name: string
  email?: string
  phone?: string
  skillLevel: SkillLevel
  notes?: string
  isActive: boolean
  referralSource?: string
}

const studentSchema = new Schema<IStudent>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'elite'],
      default: 'beginner',
    },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    referralSource: { type: String },
  },
  { timestamps: true }
)

export const Student = mongoose.model<IStudent>('Student', studentSchema)
