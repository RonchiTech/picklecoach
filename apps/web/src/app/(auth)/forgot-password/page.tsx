import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Reset your password</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-text-secondary">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
