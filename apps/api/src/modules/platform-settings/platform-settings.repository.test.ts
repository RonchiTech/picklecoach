import mongoose from 'mongoose'
import { PlatformSetting } from './platform-settings.model'
import { PlatformSettingsRepository } from './platform-settings.repository'

const TEST_DB = 'mongodb://localhost:27017/picklecoach_test'
const repo = new PlatformSettingsRepository()

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
})
afterAll(async () => {
  await PlatformSetting.deleteMany({})
  await mongoose.disconnect()
})
beforeEach(async () => {
  await PlatformSetting.deleteMany({})
})

describe('PlatformSettingsRepository', () => {
  it('returns null when gcash settings not configured', async () => {
    const result = await repo.getGcash()
    expect(result).toBeNull()
  })

  it('upserts gcash settings and retrieves them', async () => {
    await repo.upsertGcash({
      number: '09171234567',
      name: 'Test Name',
      qrUrl: 'https://example.com/qr.png',
    })
    const result = await repo.getGcash()
    expect(result).toMatchObject({ number: '09171234567', name: 'Test Name' })
  })

  it('overwrites existing gcash settings on second upsert', async () => {
    await repo.upsertGcash({ number: '09171234567', name: 'Old Name' })
    await repo.upsertGcash({ number: '09189999999', name: 'New Name' })
    const result = await repo.getGcash()
    expect(result!.number).toBe('09189999999')
  })
})
