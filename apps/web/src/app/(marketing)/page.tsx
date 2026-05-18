import type { Metadata } from 'next'
import Link from 'next/link'
import DashboardPreview from '@/components/marketing/DashboardPreview'

export const metadata: Metadata = {
  title: {
    absolute: 'PickleCoach — Coaching, not paperwork.',
  },
  description:
    'PickleCoach helps Filipino pickleball coaches manage students, sessions, and payments — all in one place. Free forever on Starter.',
  openGraph: {
    title: 'PickleCoach — Coaching, not paperwork.',
    description:
      'PickleCoach helps Filipino pickleball coaches manage students, sessions, and payments — all in one place. Free forever on Starter.',
    url: '/',
  },
}

export default function LandingPage() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PickleCoach',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: base,
    description:
      'PickleCoach helps Filipino pickleball coaches manage students, sessions, and payments — all in one place.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'PHP',
      description: 'Free forever on Starter tier. Pro available at ₱149/month.',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <div className="overflow-x-hidden">
        {/* HERO */}
        <section className="px-5 sm:px-8 lg:px-14 pt-12 sm:pt-[72px] grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-12 lg:gap-16 items-start max-w-[1200px] mx-auto">
          <div>
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-[7px] h-[7px] bg-accent rounded-full" />
              <span className="text-[11px] text-muted uppercase tracking-[0.04em] font-medium">
                Free forever on Starter · No credit card
              </span>
            </div>
            <h1 className="font-outfit text-[2.8rem] sm:text-[4rem] font-black leading-none tracking-[-0.03em] mb-5">
              Coaching,
              <br />
              not
              <br />
              <span className="text-accent">paperwork.</span>
            </h1>
            <p className="text-muted leading-relaxed mb-9 max-w-[420px]">
              PickleCoach helps Filipino pickleball coaches manage students, sessions, and payments
              — all in one place.
            </p>
            <div className="flex flex-wrap gap-2.5 mb-3">
              <Link
                href="/register"
                className="bg-accent text-[#0C0C10] font-black text-sm px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Start free
              </Link>
              <a
                href="#pricing"
                className="bg-white/5 border border-white/[0.08] text-text-secondary font-semibold text-sm px-5 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                View pricing
              </a>
              <Link
                href="/coaches"
                className="bg-white/5 border border-white/[0.08] text-text-secondary font-semibold text-sm px-5 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                Find a coach
              </Link>
            </div>
            <p className="text-xs text-[#444]">
              Starter is <span className="text-[#666] font-semibold">free forever</span> · No credit
              card · Upgrade to Pro anytime
            </p>
          </div>
          <div className="hidden lg:block">
            <DashboardPreview />
          </div>
        </section>

        {/* STATS STRIP */}
        <div className="border-y border-border px-5 sm:px-14 py-7 flex justify-center gap-8 sm:gap-[72px] mt-12 sm:mt-[72px]">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-outfit text-[1.4rem] sm:text-[1.8rem] font-black text-accent tracking-[-0.03em]">
                {s.value}
              </p>
              <p className="text-xs text-[#444] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <section className="px-5 sm:px-8 lg:px-14 pt-16 sm:pt-20 pb-12 sm:pb-16 max-w-[1200px] mx-auto">
          <p className="text-xs text-muted uppercase tracking-[0.08em] font-semibold mb-4">
            What&apos;s included
          </p>
          <h2 className="font-outfit text-[1.8rem] sm:text-[2.4rem] font-black tracking-[-0.03em] leading-[1.1] max-w-[460px] mb-3">
            Stop managing your coaching with group chats.
          </h2>
          <p className="text-muted text-sm max-w-[340px] leading-relaxed mb-10">
            Students, sessions, and payments — consolidated into one clean dashboard.
          </p>
          <div className="flex flex-col gap-0.5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="grid grid-cols-[32px_1fr] sm:grid-cols-[40px_1fr_auto] gap-4 sm:gap-5 items-start px-4 sm:px-7 py-5 sm:py-6 rounded-xl border border-transparent hover:bg-surface hover:border-border transition-colors"
              >
                <span className="font-outfit text-xs text-[#333] font-bold pt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-bold tracking-[-0.01em]">{f.title}</h3>
                    <span className="sm:hidden shrink-0 text-[10px] text-accent bg-accent/10 px-2.5 py-0.5 rounded-full font-semibold">
                      {f.tier}
                    </span>
                  </div>
                  <p className="text-muted text-sm leading-relaxed">{f.description}</p>
                </div>
                <span className="hidden sm:flex self-center text-[11px] text-accent bg-accent/10 px-3 py-0.5 rounded-full font-semibold whitespace-nowrap">
                  {f.tier}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section
          id="pricing"
          className="px-5 sm:px-8 lg:px-14 pb-16 sm:pb-20 max-w-[1200px] mx-auto"
        >
          <div className="h-px bg-border mb-12 sm:mb-16" />
          <p className="text-xs text-muted uppercase tracking-[0.08em] font-semibold mb-4">
            Pricing
          </p>
          <h2 className="font-outfit text-[1.8rem] sm:text-[2.4rem] font-black tracking-[-0.03em] leading-[1.1] mb-2.5">
            Straight talk.
            <br />
            No surprises.
          </h2>
          <p className="text-muted text-sm max-w-[420px] leading-relaxed mb-10">
            Starter is free forever. Upgrade to Pro for advanced coaching tools.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[680px] mb-7">
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-7">
              <p className="text-xs text-muted uppercase tracking-[0.08em] font-semibold mb-3">
                Starter
              </p>
              <p className="font-outfit text-[2.6rem] font-black tracking-[-0.04em] leading-none">
                Free
              </p>
              <p className="text-xs text-[#444] mt-1 mb-4">forever — no credit card</p>
              <p className="text-sm text-muted leading-relaxed pb-4 border-b border-white/5 mb-4">
                Everything you need to run your coaching business.
              </p>
              <ul className="flex flex-col gap-2 mb-6">
                {starterFeatures.map((f) => (
                  <li key={f} className="flex gap-2 items-baseline text-sm text-[#888]">
                    <span className="text-[#2a2a2a] shrink-0">—</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block text-center py-3 rounded-xl font-bold text-sm border border-border text-[#666] hover:border-muted hover:text-white transition-colors"
              >
                Start free
              </Link>
            </div>

            <div className="bg-surface border border-accent rounded-2xl p-6 sm:p-7 relative">
              <p className="text-xs text-accent uppercase tracking-[0.08em] font-semibold mb-3">
                Pro
              </p>
              <p className="font-outfit text-[2.6rem] font-black tracking-[-0.04em] leading-none">
                ₱149
              </p>
              <p className="text-xs text-[#444] mt-1 mb-4">per month · paid via GCash</p>
              <p className="text-sm text-muted leading-relaxed pb-4 border-b border-white/5 mb-4">
                Everything in Starter, plus advanced tools for growing coaches.
              </p>
              <ul className="flex flex-col gap-2 mb-6">
                <li className="flex gap-2 items-baseline text-sm text-text-secondary">
                  <span className="text-accent shrink-0">✓</span> Everything in Starter
                </li>
                {proFeatures.map((f) => (
                  <li key={f} className="flex gap-2 items-baseline text-sm text-text-secondary">
                    <span className="text-accent shrink-0">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block text-center py-3 rounded-xl font-bold text-sm bg-accent text-[#0C0C10] hover:opacity-90 transition-opacity"
              >
                Request Pro
              </Link>
            </div>
          </div>

          <p className="text-xs text-[#333] leading-[1.8] max-w-[560px]">
            Starter is free with no time limit. Pro is paid monthly via GCash — submit your receipt
            and we&apos;ll activate your account within 24 hours. Bundle discounts available for 3,
            6, and 12 month payments.
          </p>
        </section>

        {/* CTA BAND */}
        <div className="mx-5 sm:mx-8 lg:mx-14 mb-16 sm:mb-20 bg-accent rounded-[18px] px-7 sm:px-14 py-10 sm:py-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-8">
          <div>
            <h2 className="font-outfit text-[1.6rem] sm:text-[2rem] font-black text-[#0C0C10] tracking-[-0.03em] leading-[1.1] max-w-[380px]">
              Ready? Start free today.
            </h2>
            <p className="text-[#0C0C10]/60 mt-2 text-sm">
              Starter is free forever. Upgrade to Pro anytime.
            </p>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <Link
              href="/register"
              className="bg-[#0C0C10] text-white font-bold text-sm px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Start free →
            </Link>
            <Link
              href="/coaches"
              className="bg-[#0C0C10]/[0.12] text-[#0C0C10] font-semibold text-sm px-5 py-3.5 rounded-xl hover:bg-[#0C0C10]/20 transition-colors"
            >
              Find a coach
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

const stats = [
  { value: 'Free', label: 'Starter tier, forever' },
  { value: '₱149', label: 'per month for Pro' },
  { value: '4', label: 'tools in one dashboard' },
]

const features = [
  {
    title: 'Student roster',
    description:
      'Track every student — skill level, contact info, and notes. No more digging through Messenger.',
    tier: 'Starter',
  },
  {
    title: 'Session scheduling',
    description:
      "Log private and group sessions. Mark completed or cancelled. See today's lineup the moment you open the app.",
    tier: 'Starter',
  },
  {
    title: 'Payment tracking',
    description:
      "Cash, GCash, bank transfer — record it all. Know exactly who's paid and who owes, without asking.",
    tier: 'Starter',
  },
  {
    title: 'Public coach profile',
    description:
      'Get listed in the PickleCoach directory. Share your rates, specializations, and contact info with potential students.',
    tier: 'Starter',
  },
  {
    title: 'Student progress log',
    description:
      'Track skill development, goals, and milestones for each student. See the full timeline at a glance.',
    tier: 'Pro',
  },
]

const starterFeatures = [
  'Unlimited students',
  'Session scheduling',
  'Payment tracking',
  'Public coach profile',
  'Coach directory listing',
]

const proFeatures = [
  'Student progress tracking',
  'Skill tag filtering',
  'Assessment & milestone logs',
]
