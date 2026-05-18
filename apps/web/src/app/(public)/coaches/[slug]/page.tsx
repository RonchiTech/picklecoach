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

  const hasRates = coach.privateRate || coach.groupRate
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: coach.displayName,
    url: `${base}/coaches/${slug}`,
    ...(coach.bio && { description: coach.bio }),
    ...(coach.photoUrl && { image: coach.photoUrl }),
    ...(coach.contactEmail && { email: coach.contactEmail }),
    ...(coach.contactPhone && { telephone: coach.contactPhone }),
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
          className="mb-8 inline-block text-sm text-muted hover:text-white transition-colors"
        >
          ← Back to directory
        </Link>

        {/* Hero: avatar + name + city + specialization pills */}
        <div className="flex gap-5 items-start pb-6 border-b border-border mb-6">
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-[#8fb020] flex items-center justify-center shadow-[0_0_0_3px_#C8F135,0_0_0_6px_#0C0C10,0_0_0_7px_#22222E]">
                <span className="font-outfit text-[30px] font-black text-[#0C0C10] leading-none">
                  {coach.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="pt-1 min-w-0">
            <h1 className="font-outfit text-2xl font-black tracking-tight text-white mb-1">
              {coach.displayName}
            </h1>
            {coach.city && <p className="text-sm text-muted mb-3">📍 {coach.city}</p>}
            {coach.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {coach.specializations.map((s) => (
                  <span
                    key={s}
                    className="bg-accent text-[#0C0C10] text-[10px] font-bold px-2.5 py-0.5 rounded-md"
                  >
                    {SPEC_LABELS[s] ?? s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {coach.bio && (
          <div className="pb-6 border-b border-border mb-6">
            <p className="text-xs text-muted uppercase tracking-[0.1em] font-semibold mb-3">
              About
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">{coach.bio}</p>
          </div>
        )}

        {/* Sessions & Rates */}
        {coach.sessionTypes.length > 0 && (
          <div className="pb-6 border-b border-border mb-6">
            <p className="text-xs text-muted uppercase tracking-[0.1em] font-semibold mb-3">
              Sessions & Rates
            </p>
            <div className="flex gap-2 mb-5">
              {coach.sessionTypes.map((t) => (
                <span
                  key={t}
                  className="border border-accent text-accent text-xs font-semibold px-3 py-1 rounded-md capitalize"
                >
                  {t}
                </span>
              ))}
            </div>
            {hasRates && (
              <div className="grid grid-cols-2 gap-4">
                {coach.privateRate && (
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-[0.08em] mb-1">
                      Private rate
                    </p>
                    <p className="font-outfit text-[26px] font-black text-accent leading-none">
                      ₱{coach.privateRate.toLocaleString()}
                      <span className="text-xs text-muted font-normal">/hr</span>
                    </p>
                  </div>
                )}
                {coach.groupRate && (
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-[0.08em] mb-1">
                      Group rate
                    </p>
                    <p className="font-outfit text-[26px] font-black text-white leading-none">
                      ₱{coach.groupRate.toLocaleString()}
                      <span className="text-xs text-muted font-normal">/hr</span>
                    </p>
                  </div>
                )}
              </div>
            )}
            {coach.ratesNote && <p className="text-xs text-[#444] mt-3">{coach.ratesNote}</p>}
          </div>
        )}

        {/* Contact card */}
        {coach.showContactInfo && (coach.contactEmail || coach.contactPhone) && (
          <div className="bg-surface border border-accent rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-white">Interested in coaching?</p>
              <span className="text-[10px] text-[#555]">◎ {coach.totalViews} views</span>
            </div>
            <p className="text-xs text-muted mb-4">
              Reach out directly to ask about availability and rates.
            </p>
            <div className="flex flex-col gap-2">
              {coach.contactEmail && (
                <a
                  href={`mailto:${coach.contactEmail}`}
                  className="flex items-center gap-3 bg-base rounded-lg px-4 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <span className="text-accent text-sm">✉</span>
                  <span className="text-sm text-accent">{coach.contactEmail}</span>
                </a>
              )}
              {coach.contactPhone && (
                <a
                  href={`tel:${coach.contactPhone}`}
                  className="flex items-center gap-3 bg-base rounded-lg px-4 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <span className="text-muted text-sm">📱</span>
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
