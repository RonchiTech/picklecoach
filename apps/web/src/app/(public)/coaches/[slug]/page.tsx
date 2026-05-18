import type { Metadata } from 'next'
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

const AGE_LABELS: Record<string, string> = {
  kids: 'Kids',
  teens: 'Teens',
  adults: 'Adults',
  seniors: 'Seniors',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const coach = await publicApiFetch<PublicCoachProfile>(`/api/v1/coaches/${slug}`)
  if (!coach) return { title: 'Coach Not Found' }

  const location = coach.city ? ` in ${coach.city}` : ''
  const specs = coach.specializations.slice(0, 2).join(', ')
  const description = coach.bio
    ? coach.bio.slice(0, 160)
    : `${coach.displayName} is a pickleball coach${location}${specs ? ` specializing in ${specs}` : ''}.`

  return {
    title: coach.displayName,
    description,
    openGraph: {
      title: `${coach.displayName} | PickleCoach`,
      description,
      url: `/coaches/${slug}`,
      type: 'profile',
      ...(coach.photoUrl && { images: [{ url: coach.photoUrl }] }),
    },
    twitter: {
      card: 'summary',
      title: `${coach.displayName} | PickleCoach`,
      description,
    },
  }
}

export default async function CoachProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const coach = await publicApiFetch<PublicCoachProfile>(`/api/v1/coaches/${slug}`)
  if (!coach) notFound()

  const isPro = coach.subscriptionTier !== 'starter'
  const hasRates = coach.privateRate || coach.groupRate
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: coach.displayName,
    jobTitle: 'Pickleball Coach',
    url: `${base}/coaches/${slug}`,
    ...(coach.bio && { description: coach.bio }),
    ...(coach.photoUrl && { image: coach.photoUrl }),
    ...(coach.contactEmail && { email: coach.contactEmail }),
    ...(coach.contactPhone && { telephone: coach.contactPhone }),
    ...(coach.specializations.length > 0 && {
      knowsAbout: coach.specializations.map((s) => SPEC_LABELS[s] ?? s),
    }),
    ...(coach.city && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: coach.city,
        addressCountry: 'PH',
      },
    }),
  }

  return (
    <main className="min-h-screen bg-base px-6 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-xl">
        <Link
          href="/coaches"
          className="mb-8 inline-block text-sm text-muted transition-colors hover:text-white"
        >
          ← Back to directory
        </Link>

        {/* Hero: avatar + name + city + specialization pills */}
        <div className="mb-6 flex items-start gap-5 border-b border-border pb-6">
          <div className="shrink-0">
            {coach.photoUrl ? (
              <Image
                src={coach.photoUrl}
                alt={coach.displayName}
                width={80}
                height={80}
                className="rounded-full object-cover shadow-[0_0_0_3px_#C8F135,0_0_0_6px_#0C0C10,0_0_0_7px_#22222E]"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#8fb020] shadow-[0_0_0_3px_#C8F135,0_0_0_6px_#0C0C10,0_0_0_7px_#22222E]">
                <span className="font-outfit text-[30px] font-black leading-none text-[#0C0C10]">
                  {coach.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 pt-1">
            <div className="mb-1 flex items-center gap-2">
              <h1 className="font-outfit text-2xl font-black tracking-tight text-white">
                {coach.displayName}
              </h1>
              {isPro && (
                <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0C0C10]">
                  Pro
                </span>
              )}
            </div>
            {coach.city && <p className="mb-3 text-sm text-muted">📍 {coach.city}</p>}
            {coach.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {coach.specializations.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-accent px-2.5 py-0.5 text-[10px] font-bold text-[#0C0C10]"
                  >
                    {SPEC_LABELS[s] ?? s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coaching Philosophy (Pro only) */}
        {isPro && coach.coachingPhilosophy && (
          <div className="mb-6 border-b border-border pb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Coaching Philosophy
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              {coach.coachingPhilosophy}
            </p>
          </div>
        )}

        {/* Bio */}
        {coach.bio && (
          <div className="mb-6 border-b border-border pb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              About
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">{coach.bio}</p>
          </div>
        )}

        {/* Age Groups & Languages (Pro only) */}
        {isPro && (coach.ageGroups?.length > 0 || coach.languages?.length > 0) && (
          <div className="mb-6 border-b border-border pb-6">
            {coach.ageGroups?.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                  Age groups coached
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {coach.ageGroups.map((g) => (
                    <span
                      key={g}
                      className="rounded-md border border-border px-2.5 py-0.5 text-xs text-text-secondary"
                    >
                      {AGE_LABELS[g] ?? g}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {coach.languages?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                  Languages spoken
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {coach.languages.map((l) => (
                    <span
                      key={l}
                      className="rounded-md border border-border px-2.5 py-0.5 text-xs capitalize text-text-secondary"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sessions & Rates */}
        {coach.sessionTypes.length > 0 && (
          <div className="mb-6 border-b border-border pb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Sessions & Rates
            </p>
            <div className="mb-5 flex gap-2">
              {coach.sessionTypes.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-accent px-3 py-1 text-xs font-semibold capitalize text-accent"
                >
                  {t}
                </span>
              ))}
            </div>
            {hasRates && (
              <div className="grid grid-cols-2 gap-4">
                {coach.privateRate && (
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-[0.08em] text-muted">
                      Private rate
                    </p>
                    <p className="font-outfit text-[26px] font-black leading-none text-accent">
                      ₱{coach.privateRate.toLocaleString()}
                      <span className="text-xs font-normal text-muted">/hr</span>
                    </p>
                  </div>
                )}
                {coach.groupRate && (
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-[0.08em] text-muted">
                      Group rate
                    </p>
                    <p className="font-outfit text-[26px] font-black leading-none text-white">
                      ₱{coach.groupRate.toLocaleString()}
                      <span className="text-xs font-normal text-muted">/hr</span>
                    </p>
                  </div>
                )}
              </div>
            )}
            {coach.ratesNote && <p className="mt-3 text-xs text-[#444]">{coach.ratesNote}</p>}
          </div>
        )}

        {/* Social Links (Pro only) */}
        {isPro &&
          coach.socialLinks &&
          (coach.socialLinks.facebook ||
            coach.socialLinks.instagram ||
            coach.socialLinks.youtube) && (
            <div className="mb-6 border-b border-border pb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Follow on social
              </p>
              <div className="flex flex-col gap-2">
                {coach.socialLinks.facebook && (
                  <a
                    href={coach.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg bg-surface px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5"
                  >
                    <span className="text-accent">f</span> Facebook
                  </a>
                )}
                {coach.socialLinks.instagram && (
                  <a
                    href={coach.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg bg-surface px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5"
                  >
                    <span className="text-accent">◎</span> Instagram
                  </a>
                )}
                {coach.socialLinks.youtube && (
                  <a
                    href={coach.socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg bg-surface px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5"
                  >
                    <span className="text-accent">▶</span> YouTube
                  </a>
                )}
              </div>
            </div>
          )}

        {/* Contact card */}
        {coach.showContactInfo && (coach.contactEmail || coach.contactPhone) && (
          <div className="rounded-xl border border-accent bg-surface p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-white">Interested in coaching?</p>
              <span className="text-[10px] text-[#555]">◎ {coach.totalViews} views</span>
            </div>
            <p className="mb-4 text-xs text-muted">
              Reach out directly to ask about availability and rates.
            </p>
            <div className="flex flex-col gap-2">
              {coach.contactEmail && (
                <a
                  href={`mailto:${coach.contactEmail}`}
                  className="flex items-center gap-3 rounded-lg bg-base px-4 py-2.5 transition-colors hover:bg-white/5"
                >
                  <span className="text-sm text-accent">✉</span>
                  <span className="text-sm text-accent">{coach.contactEmail}</span>
                </a>
              )}
              {coach.contactPhone && (
                <a
                  href={`tel:${coach.contactPhone}`}
                  className="flex items-center gap-3 rounded-lg bg-base px-4 py-2.5 transition-colors hover:bg-white/5"
                >
                  <span className="text-sm text-muted">📱</span>
                  <span className="text-sm text-text-secondary">{coach.contactPhone}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
