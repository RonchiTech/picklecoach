'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { PublicPayment, PublicStudent } from '@picklecoach/shared'

type PaymentListProps = {
  payments: PublicPayment[]
  studentMap: Record<string, PublicStudent>
  total: number
  page: number
  limit: number
}

const STATUS_PILL: Record<string, string> = {
  paid: 'bg-success/15 text-success',
  unpaid: 'bg-error/15 text-error',
  partial: 'bg-warning/15 text-warning',
}

const STATUS_LABEL: Record<string, string> = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  partial: 'Partial',
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  bank_transfer: 'Bank transfer',
  other: 'Other',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatAmount(amount: number) {
  return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function PaymentList({ payments, studentMap, total, page, limit }: PaymentListProps) {
  const router = useRouter()
  const totalPages = Math.ceil(total / limit)

  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-muted">No payments yet.</p>
        <Link
          href="/dashboard/payments/new"
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          Add your first payment
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {payments.map((p) => {
          const student = studentMap[p.studentId]
          return (
            <div
              key={p._id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {student?.name ?? 'Unknown student'}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {METHOD_LABEL[p.method]} · {formatDate(p.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-text-primary">
                  ₱{formatAmount(p.amount)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[p.status]}`}
                >
                  {STATUS_LABEL[p.status]}
                </span>
                <Link
                  href={`/dashboard/payments/${p._id}/edit`}
                  className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:border-text-secondary hover:text-text-primary"
                >
                  Edit
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <button
            disabled={page <= 1}
            onClick={() => router.push(`/dashboard/payments?page=${page - 1}`)}
            className="rounded border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:enabled:border-text-secondary hover:enabled:text-text-primary"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => router.push(`/dashboard/payments?page=${page + 1}`)}
            className="rounded border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:enabled:border-text-secondary hover:enabled:text-text-primary"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
