import mongoose, { Document, Schema } from 'mongoose'

export interface ICoachProfile extends Document {
  _id: mongoose.Types.ObjectId
  coachId: mongoose.Types.ObjectId
  slug: string
  isPublic: boolean
  displayName: string
  bio?: string
  photoUrl?: string
  city?: string
  specializations: string[]
  sessionTypes: ('private' | 'group')[]
  privateRate?: number
  groupRate?: number
  ratesNote?: string
  contactEmail?: string
  contactPhone?: string
  showContactInfo: boolean
  totalViews: number
}

const coachProfileSchema = new Schema<ICoachProfile>(
  {
    coachId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    slug: { type: String, required: true, unique: true, trim: true },
    isPublic: { type: Boolean, default: false },
    displayName: { type: String, required: true, trim: true },
    bio: { type: String },
    photoUrl: { type: String },
    city: { type: String, trim: true },
    specializations: { type: [String], default: [] },
    sessionTypes: { type: [String], enum: ['private', 'group'], default: [] },
    privateRate: { type: Number },
    groupRate: { type: Number },
    ratesNote: { type: String },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    showContactInfo: { type: Boolean, default: false },
    totalViews: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const CoachProfile = mongoose.model<ICoachProfile>('CoachProfile', coachProfileSchema)
