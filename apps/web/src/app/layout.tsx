import type { Metadata } from 'next'
import { Outfit, DM_Sans } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'PickleCoach',
    template: '%s | PickleCoach',
  },
  description:
    'PickleCoach helps Filipino pickleball coaches manage students, sessions, and payments — all in one place.',
  openGraph: {
    type: 'website',
    siteName: 'PickleCoach',
    locale: 'en_PH',
    title: 'PickleCoach — Coaching, not paperwork.',
    description:
      'PickleCoach helps Filipino pickleball coaches manage students, sessions, and payments — all in one place.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PickleCoach — Coaching, not paperwork.',
    description:
      'PickleCoach helps Filipino pickleball coaches manage students, sessions, and payments — all in one place.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
