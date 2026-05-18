import type { PublicUser } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { PasswordForm } from '@/components/profile/PasswordForm'
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection'

export default async function ProfilePage() {
  const user = await serverApiFetch<PublicUser>('/api/v1/auth/me')

  if (!user) {
    return <p className="text-text-secondary text-sm">Unable to load profile. Please try again.</p>
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="font-outfit text-3xl font-bold text-text-primary">Profile</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your account details</p>
      </div>

      <div className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Account info
        </h2>
        <ProfileForm user={user} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Change password
        </h2>
        <PasswordForm />
      </div>

      <DeleteAccountSection />
    </div>
  )
}
