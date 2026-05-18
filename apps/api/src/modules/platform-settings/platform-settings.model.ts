import mongoose, { Document, Schema } from 'mongoose'

export interface IPlatformSetting extends Document {
  key: string
  value: Record<string, unknown>
}

const schema = new Schema<IPlatformSetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
)

export const PlatformSetting = mongoose.model<IPlatformSetting>('PlatformSetting', schema)
