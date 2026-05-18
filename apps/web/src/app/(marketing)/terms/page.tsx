import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms and conditions for using PickleCoach, including subscription terms, payment policy, and acceptable use.',
  robots: { index: true, follow: true },
}

const EFFECTIVE_DATE = 'May 18, 2026'
const CONTACT_EMAIL = 'hello@picklecoach.app'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-base px-6 py-14">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs text-muted uppercase tracking-[0.08em] font-semibold mb-3">Legal</p>
        <h1 className="font-outfit text-3xl font-black tracking-tight text-white mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-muted mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="flex flex-col gap-8 text-sm text-text-secondary leading-relaxed">
          <Section title="Who these terms apply to">
            <p>
              These Terms of Service ("Terms") govern your use of PickleCoach, a web application for
              pickleball coaches operating in the Philippines. By creating an account, you agree to
              these Terms. If you do not agree, do not use the platform.
            </p>
            <p className="mt-3">
              PickleCoach is intended for use by coaches. Students and the general public may browse
              the public coach directory without an account.
            </p>
          </Section>

          <Section title="Your account">
            <ul className="flex flex-col gap-2">
              {[
                'You must provide accurate information when registering.',
                'You are responsible for keeping your password secure. PickleCoach is not liable for losses caused by unauthorized access to your account.',
                'You may not share your account with others or create accounts on behalf of third parties without their consent.',
                'You must be at least 18 years old to create an account.',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Subscription plans">
            <p className="mb-4">PickleCoach offers two tiers:</p>
            <div className="rounded-xl border border-border overflow-hidden mb-4">
              <div className="grid grid-cols-[120px_1fr] gap-4 px-4 py-3 border-b border-border text-xs">
                <span className="text-white font-semibold">Starter</span>
                <span className="text-muted">
                  Free forever. Includes student roster, session scheduling, payment tracking, and a
                  public coach profile. No credit card required.
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-4 px-4 py-3 text-xs">
                <span className="text-white font-semibold">Pro</span>
                <span className="text-muted">
                  ₱149 per month (or ₱399 / 3 months, ₱750 / 6 months, ₱1,490 / 12 months). Includes
                  everything in Starter plus student progress tracking.
                </span>
              </div>
            </div>
            <p>
              Prices are in Philippine Peso (₱) and inclusive of all applicable taxes, if any. We
              reserve the right to change pricing with 30 days' notice to active subscribers.
            </p>
          </Section>

          <Section title="Payment and billing">
            <p>Pro subscriptions are paid manually via GCash. To subscribe:</p>
            <ol className="flex flex-col gap-2 mt-3 list-none">
              {[
                'Select your bundle length from the Upgrade page in your dashboard.',
                'Send the exact amount to the PickleCoach GCash number displayed on that page.',
                'Upload a clear screenshot of your GCash payment receipt.',
                'A PickleCoach administrator will review and activate your Pro access within 24 hours.',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-accent font-bold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4">
              Your Pro access expires at the end of the period you paid for. You will not be charged
              automatically — you must manually renew before expiry to continue Pro access. If you
              do not renew, your account reverts to Starter automatically.
            </p>
          </Section>

          <Section title="Refund policy">
            <div className="bg-surface border border-border rounded-xl p-4 mb-3">
              <p className="font-semibold text-white mb-1">
                All Pro subscription payments are non-refundable.
              </p>
              <p>
                Once a payment receipt has been reviewed and your Pro access activated, no refund
                will be issued for any unused portion of the subscription period, including in cases
                of voluntary downgrade or account deletion.
              </p>
            </div>
            <p>
              If your Pro access was not activated within 48 hours of a verified payment, contact us
              at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
                {CONTACT_EMAIL}
              </a>{' '}
              and we will resolve it promptly.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>You agree not to:</p>
            <ul className="flex flex-col gap-2 mt-3">
              {[
                'Use the platform for any unlawful purpose or in violation of any Philippine law.',
                'Upload content that is fraudulent, misleading, or infringes on the rights of others.',
                'Attempt to gain unauthorized access to other accounts or the platform infrastructure.',
                'Use automated tools (bots, scrapers) against the platform without written permission.',
                'Upload malicious files or attempt to introduce malware.',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Your data and student data">
            <p>
              You own the data you enter into PickleCoach — your student records, sessions, and
              payments belong to you. You are responsible for obtaining appropriate consent from
              your students to store their personal information on a third-party platform, in
              compliance with the Data Privacy Act of 2012 (RA 10173).
            </p>
            <p className="mt-3">
              Our use of your personal data is governed by our{' '}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </Section>

          <Section title="Termination">
            <p>
              You may delete your account at any time from your Profile page. All your data will be
              permanently deleted within 24 hours.
            </p>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms, engage
              in fraudulent activity, or pose a security risk — with or without prior notice.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              PickleCoach is provided "as is." We do not guarantee uninterrupted availability and
              are not liable for data loss, lost revenue, or other indirect damages arising from
              your use of the platform.
            </p>
            <p className="mt-3">
              Our total liability for any claim arising from these Terms shall not exceed the amount
              you paid to PickleCoach in the three months preceding the claim.
            </p>
          </Section>

          <Section title="Dispute resolution">
            <p>
              If you have a complaint, email us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
                {CONTACT_EMAIL}
              </a>{' '}
              and we will attempt to resolve it within 7 business days.
            </p>
            <p className="mt-3">
              If we cannot reach a resolution, disputes shall be governed by the laws of the
              Republic of the Philippines and subject to the jurisdiction of the courts of Metro
              Manila.
            </p>
          </Section>

          <Section title="Changes to these Terms">
            <p>
              We will notify registered coaches by email at least 7 days before making material
              changes. Continued use of the platform after changes take effect constitutes
              acceptance of the updated Terms.
            </p>
          </Section>

          <div className="border-t border-border pt-6 text-xs text-muted">
            <p>
              These Terms are governed by the laws of the Republic of the Philippines, including the
              Internet Transactions Act of 2023 (RA 11967) and the Consumer Act of the Philippines
              (RA 7394).
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
