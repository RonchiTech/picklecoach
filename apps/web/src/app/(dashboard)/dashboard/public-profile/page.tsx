import type { PublicCoachProfile, PublicUser } from '@picklecoach/shared'
import Link from 'next/link'
import { serverApiFetch } from '@/lib/server-api'
import { IdentityForm } from '@/components/public-profile/IdentityForm'
import { CoachingDetailsForm } from '@/components/public-profile/CoachingDetailsForm'
import { RatesForm } from '@/components/public-profile/RatesForm'
import { ContactVisibilityForm } from '@/components/public-profile/ContactVisibilityForm'
import { SocialLinksForm } from '@/components/public-profile/SocialLinksForm'
import { PhilosophyForm } from '@/components/public-profile/PhilosophyForm'

export default async function PublicProfilePage() {
  const [profile, user] = await Promise.all([
    serverApiFetch<PublicCoachProfile>('/api/v1/coach-profiles/me'),
    serverApiFetch<PublicUser>('/api/v1/auth/me'),
  ])

  if (!profile) {
    return <p className="text-text-secondary text-sm">Unable to load profile. Please try again.</p>
  }

  const isPro = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'team'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const publicProfileUrl = `${siteUrl}/coaches/${profile.slug}`

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="font-outfit text-3xl font-bold text-text-primary">Public Profile</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your public listing on PickleCoach
        </p>
        <div className="mt-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-secondary">
          <span>Your public URL: </span>
          {profile.isPublic ? (
            <Link
              href={`/coaches/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent underline"
            >
              {publicProfileUrl.replace(/^https?:\/\//, '')}
            </Link>
          ) : (
            <span className="font-medium text-text-secondary opacity-50">
              {publicProfileUrl.replace(/^https?:\/\//, '')}
            </span>
          )}
          {!profile.isPublic && (
            <p className="mt-1 text-xs text-text-secondary opacity-60">
              Enable &ldquo;List me in the coach directory&rdquo; below to activate this link.
            </p>
          )}
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
        <CoachingDetailsForm profile={profile} isPro={isPro} />
      </div>

      <div className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Rates
        </h2>
        <RatesForm profile={profile} />
      </div>

      <div className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Contact & Visibility
        </h2>
        <ContactVisibilityForm profile={profile} />
      </div>

      <div className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Social Media
        </h2>
        <SocialLinksForm profile={profile} isPro={isPro} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-text-primary">
          Coaching Philosophy
        </h2>
        <PhilosophyForm profile={profile} isPro={isPro} />
      </div>
    </div>
  )
}
