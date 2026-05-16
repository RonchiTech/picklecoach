import type { PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { PaymentForm } from '@/components/payments/PaymentForm'

export default async function NewPaymentPage() {
  const students = await serverApiFetch<PublicStudent[]>('/api/v1/students')

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Add payment</h1>
      <p className="mt-1 text-sm text-text-secondary">Record a payment from a student</p>
      <div className="mt-6">
        <PaymentForm students={students ?? []} />
      </div>
    </div>
  )
}
