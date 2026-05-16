import { notFound } from 'next/navigation'
import type { PublicPayment, PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { PaymentForm } from '@/components/payments/PaymentForm'

type Props = { params: Promise<{ id: string }> }

export default async function EditPaymentPage({ params }: Props) {
  const { id } = await params
  const [payment, students] = await Promise.all([
    serverApiFetch<PublicPayment>(`/api/v1/payments/${id}`),
    serverApiFetch<PublicStudent[]>('/api/v1/students'),
  ])

  if (!payment) notFound()

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Edit payment</h1>
      <p className="mt-1 text-sm text-text-secondary">Update payment details or status</p>
      <div className="mt-6">
        <PaymentForm students={students ?? []} payment={payment} />
      </div>
    </div>
  )
}
