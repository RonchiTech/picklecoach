import type { PublicPayment, PublicStudent } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { PaymentList } from '@/components/payments/PaymentList'

type Props = { searchParams: Promise<{ page?: string }> }

export default async function PaymentsPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1') || 1)

  const [result, students] = await Promise.all([
    serverApiFetch<{ payments: PublicPayment[]; total: number; page: number; limit: number }>(
      `/api/v1/payments?page=${page}&limit=20`
    ),
    serverApiFetch<PublicStudent[]>('/api/v1/students'),
  ])

  const studentMap = Object.fromEntries((students ?? []).map((s) => [s._id, s]))
  const payments = result?.payments ?? []
  const total = result?.total ?? 0

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-text-primary">Payments</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {total} record{total !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="/dashboard/payments/new"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-base transition-opacity hover:opacity-90"
        >
          + Add payment
        </a>
      </div>

      <div className="mt-6">
        <PaymentList
          payments={payments}
          studentMap={studentMap}
          total={total}
          page={page}
          limit={20}
        />
      </div>
    </div>
  )
}
