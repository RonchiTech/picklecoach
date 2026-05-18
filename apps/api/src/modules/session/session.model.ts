import mongoose, { Document, Schema } from 'mongoose'
import type { SessionType, SessionStatus } from '@picklecoach/shared'

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId
  coachId: mongoose.Types.ObjectId
  studentIds: mongoose.Types.ObjectId[]
  type: SessionType
  status: SessionStatus
  scheduledAt: Date
  durationMinutes: number
  notes?: string
  rating?: number
}

const sessionSchema = new Schema<ISession>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    type: { type: String, enum: ['private', 'group'], default: 'private' },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    notes: { type: String },
    rating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
)

export const Session = mongoose.model<ISession>('Session', sessionSchema)
