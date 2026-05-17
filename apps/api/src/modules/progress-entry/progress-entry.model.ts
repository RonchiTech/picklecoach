import mongoose, { Document, Schema } from 'mongoose'
import type { ProgressEntryType } from '@picklecoach/shared'

export interface IProgressEntry extends Document {
  _id: mongoose.Types.ObjectId
  coachId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  sessionId?: mongoose.Types.ObjectId
  type: ProgressEntryType
  content: string
  skillTags: string[]
}

const progressEntrySchema = new Schema<IProgressEntry>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session' },
    type: {
      type: String,
      enum: ['general', 'assessment', 'goal', 'milestone'],
      default: 'general',
    },
    content: { type: String, required: true, maxlength: 2000 },
    skillTags: [{ type: String, maxlength: 50 }],
  },
  { timestamps: true }
)

export const ProgressEntry = mongoose.model<IProgressEntry>('ProgressEntry', progressEntrySchema)
