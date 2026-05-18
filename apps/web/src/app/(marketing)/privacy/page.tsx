import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How PickleCoach collects, uses, and protects your personal data under the Philippine Data Privacy Act of 2012.',
  robots: { index: true, follow: true },
}

const EFFECTIVE_DATE = 'May 18, 2026'
const CONTACT_EMAIL = 'privacy@picklecoach.app'
const COMPANY_NAME = 'PickleCoach'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-base px-6 py-14">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs text-muted uppercase tracking-[0.08em] font-semibold mb-3">Legal</p>
        <h1 className="font-outfit text-3xl font-black tracking-tight text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="flex flex-col gap-8 text-sm text-text-secondary leading-relaxed">
          <Section title="Who we are">
            <p>
              {COMPANY_NAME} is a web application that helps Filipino pickleball coaches manage
              their students, sessions, and payments. We are the personal information controller for
              data collected through this platform.
            </p>
            <p className="mt-3">
              For privacy concerns, contact our Data Protection Officer at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="What we collect and why">
            <Table
              rows={[
                ['Full name', 'To identify your account and display it to students'],
                [
                  'Email address',
                  'To log in, receive password resets, and receive service notifications',
                ],
                ['Phone number', 'Optional — displayed on your public coach profile if you choose'],
                ['Password', 'Stored as a one-way hash (bcrypt). We cannot read your password.'],
                [
                  'Student records',
                  'Names, skill levels, and notes you enter about your own students',
                ],
                ['Session records', 'Session schedules and statuses you log on the platform'],
                ['Payment records', 'Payment amounts and methods you record for your students'],
                [
                  'GCash receipt image',
                  'Uploaded by you to verify a Pro subscription payment; stored on Cloudinary',
                ],
                [
                  'Coach profile',
                  'Display name, bio, city, rates, and contact info you choose to publish',
                ],
              ]}
            />
            <p className="mt-4">
              The legal basis for processing is{' '}
              <strong className="text-white">performance of contract</strong> — we process your data
              to provide the service you signed up for (Republic Act 10173, Section 13).
            </p>
          </Section>

          <Section title="How long we keep your data">
            <p>
              We retain your data for as long as your account is active. If you delete your account,
              all your data — including students, sessions, payments, and your coach profile — is
              permanently deleted within 24 hours. Receipt images on Cloudinary are deleted within
              30 days of account deletion.
            </p>
          </Section>

          <Section title="Who we share your data with">
            <p>We use the following third-party services to operate the platform:</p>
            <Table
              rows={[
                ['MongoDB Atlas', 'Database hosting — your data is encrypted at rest'],
                ['Cloudinary', 'Receipt image storage for Pro subscription verification'],
                ['Resend', 'Transactional email delivery (password resets, notifications)'],
              ]}
            />
            <p className="mt-4">
              We do not sell your data. We do not share your data with advertisers. Your student
              data is yours — we do not share it with other coaches or third parties.
            </p>
          </Section>

          <Section title="Public coach profile">
            <p>
              If you enable your public profile, the following information becomes publicly visible
              to anyone who visits the PickleCoach coach directory: display name, city, bio,
              specializations, session types, rates, and — only if you explicitly enable it — your
              contact email and phone number.
            </p>
            <p className="mt-3">
              You can make your profile private or delete it at any time from your dashboard.
            </p>
          </Section>

          <Section title="Your rights under RA 10173">
            <p>
              As a data subject under the Philippine Data Privacy Act of 2012, you have the right
              to:
            </p>
            <ul className="mt-3 flex flex-col gap-2 list-none">
              {[
                ['Access', 'Request a copy of the personal data we hold about you'],
                ['Rectification', 'Correct inaccurate or incomplete data in your account settings'],
                [
                  'Erasure',
                  'Delete your account and all associated data at any time from the Profile page',
                ],
                ['Portability', 'Request an export of your data in a machine-readable format'],
                [
                  'Object',
                  'Object to processing based on legitimate interest (does not apply here as we process on contractual basis)',
                ],
              ].map(([right, desc]) => (
                <li key={right} className="flex gap-3">
                  <span className="text-accent font-semibold shrink-0 w-28">{right}</span>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              To exercise any right, email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
                {CONTACT_EMAIL}
              </a>
              . We will respond within 15 business days.
            </p>
          </Section>

          <Section title="Data breach notification">
            <p>
              In the event of a personal data breach that is likely to result in serious harm, we
              will notify the National Privacy Commission within 72 hours of discovery, and affected
              users as soon as reasonably practicable, in compliance with NPC Circular 16-03.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              We use a single authentication cookie (<code className="text-accent">token</code>) to
              keep you logged in. This cookie is <strong className="text-white">httpOnly</strong>{' '}
              (not accessible to JavaScript), marked <strong className="text-white">Secure</strong>{' '}
              in production, and expires after 7 days. We do not use advertising cookies or
              third-party tracking cookies.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We will notify registered coaches by email at least 7 days before making material
              changes to this policy. The effective date above will be updated with each revision.
            </p>
          </Section>

          <div className="border-t border-border pt-6 text-xs text-muted">
            <p>
              This policy is governed by the laws of the Republic of the Philippines. For
              complaints, you may contact the{' '}
              <a
                href="https://www.privacy.gov.ph"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                National Privacy Commission
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-outfit text-base font-bold text-white mb-3">{title}</h2>
      {children}
    </div>
  )
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden mt-2">
      {rows.map(([label, desc], i) => (
        <div
          key={label}
          className={`grid grid-cols-[160px_1fr] gap-4 px-4 py-3 text-xs ${i !== rows.length - 1 ? 'border-b border-border' : ''}`}
        >
          <span className="text-white font-medium">{label}</span>
          <span className="text-muted">{desc}</span>
        </div>
      ))}
    </div>
  )
}
