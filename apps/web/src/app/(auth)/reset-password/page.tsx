import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Set new password</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Choose a new password for your account.
          </p>
        </div>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
