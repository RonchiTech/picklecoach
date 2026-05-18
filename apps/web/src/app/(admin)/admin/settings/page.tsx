import type { PlatformSettingsGcash } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { GcashSettingsForm } from '@/components/admin/GcashSettingsForm'

export default async function AdminSettingsPage() {
  const gcash = await serverApiFetch<PlatformSettingsGcash>('/api/v1/admin/settings/gcash')

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-outfit text-3xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Configure platform-wide settings.</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-sm font-semibold text-text-primary">GCash Payment Details</h2>
        <p className="mb-5 text-xs text-text-secondary">
          These details are shown to coaches on the upgrade page. If not configured, coaches will
          see a &ldquo;not yet available&rdquo; message.
        </p>
        <GcashSettingsForm current={gcash} />
      </div>
    </div>
  )
}
