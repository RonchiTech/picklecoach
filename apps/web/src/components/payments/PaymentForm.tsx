'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublicPayment, PublicStudent } from '@picklecoach/shared'
import { apiFetch } from '@/lib/api'

type PaymentFormProps = {
  students: PublicStudent[]
  payment?: PublicPayment
}

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-accent focus:outline-none'
const LABEL_CLS = 'block text-sm font-medium text-text-secondary'

export function PaymentForm({ students, payment }: PaymentFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isEdit = !!payment

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
        ?.value ?? ''

    const body = {
      studentId: getValue('studentId'),
      amount: Number(getValue('amount')),
      method: getValue('method'),
      status: getValue('status'),
      notes: getValue('notes') || undefined,
    }

    try {
      const path = isEdit ? `/api/v1/payments/${payment._id}` : '/api/v1/payments'
      const method = isEdit ? 'PATCH' : 'POST'
      await apiFetch(path, { method, body: isEdit ? { ...body, studentId: undefined } : body })
      router.push('/dashboard/payments')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5">
      {!isEdit && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="studentId" className={LABEL_CLS}>
            Student <span className="text-error">*</span>
          </label>
          <select id="studentId" name="studentId" required defaultValue="" className={INPUT_CLS}>
            <option value="" disabled>
              Select student…
            </option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className={LABEL_CLS}>
          Amount (₱) <span className="text-error">*</span>
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={payment?.amount ?? ''}
          placeholder="0.00"
          className={INPUT_CLS}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="method" className={LABEL_CLS}>
            Method
          </label>
          <select
            id="method"
            name="method"
            defaultValue={payment?.method ?? 'cash'}
            className={INPUT_CLS}
          >
            <option value="cash">Cash</option>
            <option value="gcash">GCash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="status" className={LABEL_CLS}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={payment?.status ?? 'unpaid'}
            className={INPUT_CLS}
          >
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className={LABEL_CLS}>
          Notes <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={payment?.notes}
          placeholder="e.g. 3 sessions this week"
          className={INPUT_CLS}
        />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add payment'}
        </button>
        <a
          href="/dashboard/payments"
          className="rounded-lg border border-border px-6 py-2.5 text-sm text-text-secondary transition-colors hover:border-text-secondary hover:text-text-primary"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
