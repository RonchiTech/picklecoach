import type { PublicCoachProfile } from '@picklecoach/shared'
import Link from 'next/link'
import Image from 'next/image'

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

export function CoachCard({ coach }: { coach: PublicCoachProfile }) {
  const isPro = coach.subscriptionTier !== 'starter'

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        {coach.photoUrl ? (
          <Image
            src={coach.photoUrl}
            alt={coach.displayName}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-border text-lg font-bold text-text-secondary">
            {coach.displayName.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-outfit font-semibold text-text-primary">
              {coach.displayName}
            </p>
            {isPro && (
              <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-base uppercase tracking-wide">
                Pro
              </span>
            )}
          </div>
          {coach.city && <p className="text-xs text-text-secondary">{coach.city}</p>}
        </div>
      </div>

      {coach.specializations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {coach.specializations.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-full border border-border px-2 py-0.5 text-xs text-text-secondary"
            >
              {SPEC_LABELS[s] ?? s}
            </span>
          ))}
        </div>
      )}

      {coach.sessionTypes.length > 0 && (
        <p className="text-xs text-text-secondary">
          {coach.sessionTypes.map((t) => (t === 'private' ? 'Private' : 'Group')).join(' · ')}
        </p>
      )}

      <Link
        href={`/coaches/${coach.slug}`}
        className="mt-auto inline-block rounded-lg border border-accent px-4 py-2 text-center text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-base"
      >
        View Profile
      </Link>
    </div>
  )
}
