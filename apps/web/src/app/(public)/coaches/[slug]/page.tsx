import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { PublicCoachProfile } from '@picklecoach/shared'
import { publicApiFetch } from '@/lib/public-api'

const SPEC_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  dinking: 'Dinking',
  serve: 'Serve',
  '3rd-shot-drop': '3rd Shot Drop',
  footwork: 'Footwork',
  strategy: 'Strategy',
  doubles: 'Doubles',
  singles: 'Singles',
}

export default async function CoachProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const coach = await publicApiFetch<PublicCoachProfile>(`/api/v1/coaches/${slug}`)
  if (!coach) notFound()

  return (
    <main className="min-h-screen bg-base px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/coaches"
          className="mb-8 inline-block text-sm text-text-secondary hover:text-accent"
        >
          ← Back to directory
        </Link>

        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-6 flex items-start gap-4">
            {coach.photoUrl ? (
              <Image
                src={coach.photoUrl}
                alt={coach.displayName}
                width={72}
                height={72}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-border text-2xl font-bold text-text-secondary">
                {coach.displayName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-outfit text-2xl font-bold text-text-primary">
                {coach.displayName}
              </h1>
              {coach.city && <p className="text-text-secondary">{coach.city}</p>}
              {coach.specializations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {coach.specializations.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border px-2 py-0.5 text-xs text-text-secondary"
                    >
                      {SPEC_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {coach.bio && (
            <div className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-text-primary">About</h2>
              <p className="text-sm text-text-secondary">{coach.bio}</p>
            </div>
          )}

          {coach.sessionTypes.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-text-primary">Sessions</h2>
              <div className="flex gap-2">
                {coach.sessionTypes.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border px-3 py-1 text-xs capitalize text-text-secondary"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {(coach.privateRate || coach.groupRate) && (
                <div className="mt-3 flex gap-6 text-sm text-text-secondary">
                  {coach.privateRate && <span>Private: ₱{coach.privateRate}/hr</span>}
                  {coach.groupRate && <span>Group: ₱{coach.groupRate}/hr</span>}
                </div>
              )}
              {coach.ratesNote && (
                <p className="mt-2 text-xs text-text-secondary">{coach.ratesNote}</p>
              )}
            </div>
          )}

          {coach.showContactInfo && (coach.contactEmail || coach.contactPhone) && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-text-primary">Contact</h2>
              {coach.contactEmail && (
                <p className="text-sm text-text-secondary">{coach.contactEmail}</p>
              )}
              {coach.contactPhone && (
                <p className="text-sm text-text-secondary">{coach.contactPhone}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
