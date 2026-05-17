import Link from 'next/link'
import DashboardPreview from '@/components/marketing/DashboardPreview'

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="px-14 pt-[72px] grid grid-cols-[1fr_460px] gap-16 items-start max-w-[1200px] mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-[7px] h-[7px] bg-accent rounded-full" />
            <span className="text-[11px] text-muted uppercase tracking-[0.04em] font-medium">
              90-day free trial · No credit card
            </span>
          </div>
          <h1 className="font-outfit text-[4rem] font-black leading-none tracking-[-0.03em] mb-5">
            Coaching,
            <br />
            not
            <br />
            <span className="text-accent">paperwork.</span>
          </h1>
          <p className="text-muted leading-relaxed mb-9 max-w-[420px]">
            PickleCoach helps Filipino pickleball coaches manage students, sessions, and payments —
            all in one place.
          </p>
          <div className="flex gap-2.5 mb-3">
            <Link
              href="/register"
              className="bg-accent text-[#0C0C10] font-black text-sm px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Start free trial
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
            Free for <span className="text-[#666] font-semibold">90 days</span> · No credit card ·
            Cancel anytime
          </p>
        </div>
        <DashboardPreview />
      </section>

      {/* ── STATS STRIP ──────────────────────────────────── */}
      <div className="border-y border-border px-14 py-7 flex justify-center gap-[72px] mt-[72px]">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-outfit text-[1.8rem] font-black text-accent tracking-[-0.03em]">
              {s.value}
            </p>
            <p className="text-xs text-[#444] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="px-14 pt-20 pb-16 max-w-[1200px] mx-auto">
        <p className="text-xs text-muted uppercase tracking-[0.08em] font-semibold mb-4">
          What&apos;s included
        </p>
        <h2 className="font-outfit text-[2.4rem] font-black tracking-[-0.03em] leading-[1.1] max-w-[460px] mb-3">
          Stop managing your coaching with group chats.
        </h2>
        <p className="text-muted text-sm max-w-[340px] leading-relaxed mb-10">
          Students, sessions, and payments — consolidated into one clean dashboard.
        </p>
        <div className="flex flex-col gap-0.5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="grid grid-cols-[40px_1fr_auto] gap-5 items-start px-7 py-6 rounded-xl border border-transparent hover:bg-surface hover:border-border transition-colors"
            >
              <span className="font-outfit text-xs text-[#333] font-bold pt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-bold tracking-[-0.01em] mb-1">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.description}</p>
              </div>
              <span className="self-center text-[11px] text-accent bg-accent/10 px-3 py-0.5 rounded-full font-semibold whitespace-nowrap">
                Available now
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section id="pricing" className="px-14 pb-20 max-w-[1200px] mx-auto">
        <div className="h-px bg-border mb-16" />
        <p className="text-xs text-muted uppercase tracking-[0.08em] font-semibold mb-4">Pricing</p>
        <h2 className="font-outfit text-[2.4rem] font-black tracking-[-0.03em] leading-[1.1] mb-2.5">
          Straight talk.
          <br />
          No surprises.
        </h2>
        <p className="text-muted text-sm max-w-[420px] leading-relaxed mb-10">
          Start free for 90 days on Starter. No credit card. Upgrade to Pro when it launches —
          cancel whenever you want.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-[680px] mb-7">
          {/* Starter */}
          <div className="bg-surface border border-border rounded-2xl p-7">
            <p className="text-xs text-muted uppercase tracking-[0.08em] font-semibold mb-3">
              Starter
            </p>
            <p className="font-outfit text-[2.6rem] font-black tracking-[-0.04em] leading-none">
              ₱99
            </p>
            <p className="text-xs text-[#444] mt-1 mb-4">per month after trial</p>
            <p className="text-sm text-muted leading-relaxed pb-4 border-b border-white/5 mb-4">
              Everything you need to run your coaching business today.
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
              Start free trial
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-surface border border-accent rounded-2xl p-7 relative">
            <span className="absolute -top-[11px] left-6 bg-accent text-[#0C0C10] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.06em]">
              Coming soon
            </span>
            <p className="text-xs text-accent uppercase tracking-[0.08em] font-semibold mb-3">
              Pro
            </p>
            <p className="font-outfit text-[2.6rem] font-black tracking-[-0.04em] leading-none">
              ₱299
            </p>
            <p className="text-xs text-[#444] mt-1 mb-4">per month after trial</p>
            <p className="text-sm text-muted leading-relaxed pb-4 border-b border-white/5 mb-4">
              Everything in Starter, plus advanced tools as they launch.
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              <li className="flex gap-2 items-baseline text-sm text-text-secondary">
                <span className="text-accent shrink-0">✓</span> Everything in Starter
              </li>
              {proFeatures.map((f) => (
                <li
                  key={f}
                  className="flex gap-2 items-baseline text-sm text-text-secondary opacity-45"
                >
                  <span className="text-accent shrink-0">✓</span>
                  {f}
                  <span className="text-[11px] text-muted">· soon</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block text-center py-3 rounded-xl font-bold text-sm bg-accent text-[#0C0C10] hover:opacity-90 transition-opacity"
            >
              Join waitlist
            </Link>
          </div>
        </div>

        <p className="text-xs text-[#333] leading-[1.8] max-w-[560px]">
          All plans include a <strong className="text-[#555]">90-day free trial on Starter</strong>{' '}
          — no credit card required. Pro features are in development and will roll out to Pro
          subscribers first. Items marked <em>soon</em> are not yet available. After your trial,
          accounts that remain unpaid are locked for 7 days, then archived. Your data is preserved —
          reactivate anytime.
        </p>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────── */}
      <div className="mx-14 mb-20 bg-accent rounded-[18px] px-14 py-12 flex justify-between items-center gap-8">
        <div>
          <h2 className="font-outfit text-[2rem] font-black text-[#0C0C10] tracking-[-0.03em] leading-[1.1] max-w-[380px]">
            Ready? 90 days on us.
          </h2>
          <p className="text-[#0C0C10]/60 mt-2 text-sm">
            No credit card. No commitment. Just less chaos.
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <Link
            href="/register"
            className="bg-[#0C0C10] text-white font-bold text-sm px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Start free trial →
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
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

const stats = [
  { value: '90', label: 'days free, no card needed' },
  { value: '₱99', label: 'per month after trial' },
  { value: '3', label: 'tools in one dashboard' },
]

const features = [
  {
    title: 'Student roster',
    description:
      'Track every student — skill level, contact info, and notes. No more digging through Messenger.',
  },
  {
    title: 'Session scheduling',
    description:
      "Log private and group sessions. Mark completed or cancelled. See today's lineup the moment you open the app.",
  },
  {
    title: 'Payment tracking',
    description:
      "Cash, GCash, bank transfer — record it all. Know exactly who's paid and who owes, without asking.",
  },
  {
    title: 'Public coach profile',
    description:
      'Get listed in the PickleCoach directory. Share your rates, specializations, and contact info with potential students.',
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
  'Student progress log',
  'Session notes',
  'Payment reports',
  'Email reminders',
  'Profile analytics',
]
