import type { PlatformSettingsGcash } from '@picklecoach/shared'
import { PlatformSetting } from './platform-settings.model'

export class PlatformSettingsRepository {
  async getGcash(): Promise<PlatformSettingsGcash | null> {
    const doc = await PlatformSetting.findOne({ key: 'gcash' })
    if (!doc) return null
    return doc.value as unknown as PlatformSettingsGcash
  }

  async upsertGcash(data: PlatformSettingsGcash): Promise<void> {
    await PlatformSetting.findOneAndUpdate(
      { key: 'gcash' },
      { $set: { value: data } },
      { upsert: true }
    )
  }
}
