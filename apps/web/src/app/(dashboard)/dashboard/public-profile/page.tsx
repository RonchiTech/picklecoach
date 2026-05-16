import type { PublicCoachProfile } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { IdentityForm } from '@/components/public-profile/IdentityForm'
import { CoachingDetailsForm } from '@/components/public-profile/CoachingDetailsForm'
import { RatesForm } from '@/components/public-profile/RatesForm'
import { ContactVisibilityForm } from '@/components/public-profile/ContactVisibilityForm'

export default async function PublicProfilePage() {
  const profile = await serverApiFetch<PublicCoachProfile>('/api/v1/coach-profiles/me')

  if (!profile) {
    return <p className="text-text-secondary text-sm">Unable to load profile. Please try again.</p>
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="font-outfit text-3xl font-bold text-text-primary">Public Profile</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your public listing on PickleCoach
        </p>
        <div className="mt-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-secondary">
          Your public URL:{' '}
          <span className="font-medium text-accent">picklecoach.com/coaches/{profile.slug}</span>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Identity
        </h2>
        <IdentityForm profile={profile} />
      </div>

      <div className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Coaching Details
        </h2>
        <CoachingDetailsForm profile={profile} />
      </div>

      <div className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Rates
        </h2>
        <RatesForm profile={profile} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Contact & Visibility
        </h2>
        <ContactVisibilityForm profile={profile} />
      </div>
    </div>
  )
}
