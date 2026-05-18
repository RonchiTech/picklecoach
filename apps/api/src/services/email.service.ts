import { Resend } from 'resend'
import { env } from '../config/env'

const resend = new Resend(env.RESEND_API_KEY)

export async function sendUpgradeRequestReceived(
  coachEmail: string,
  coachName: string,
  months: number,
  amountDue: number
): Promise<void> {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: coachEmail,
    subject: 'PickleCoach — Upgrade request received',
    html: `<p>Hi ${coachName},</p>
<p>We received your Pro upgrade request for <strong>${months} month${months > 1 ? 's' : ''}</strong> (₱${amountDue}).</p>
<p>We'll review your GCash receipt and activate your Pro account within 24 hours.</p>
<p>— The PickleCoach Team</p>`,
  })
}

export async function sendUpgradeApproved(
  coachEmail: string,
  coachName: string,
  months: number,
  proEndsAt: Date
): Promise<void> {
  const expiryStr = proEndsAt.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: coachEmail,
    subject: 'PickleCoach — Pro account activated!',
    html: `<p>Hi ${coachName},</p>
<p>Your Pro subscription is now active for <strong>${months} month${months > 1 ? 's' : ''}</strong>.</p>
<p>Your Pro access expires on <strong>${expiryStr}</strong>.</p>
<p>Enjoy all Pro features — track student progress, and more.</p>
<p>— The PickleCoach Team</p>`,
  })
}

export async function sendUpgradeRejected(
  coachEmail: string,
  coachName: string,
  notes?: string
): Promise<void> {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: coachEmail,
    subject: 'PickleCoach — Upgrade request update',
    html: `<p>Hi ${coachName},</p>
<p>Unfortunately, we were unable to approve your upgrade request.</p>
${notes ? `<p>Reason: ${notes}</p>` : ''}
<p>Please double-check your GCash receipt and submit a new request, or contact support.</p>
<p>— The PickleCoach Team</p>`,
  })
}
