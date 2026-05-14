import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="mt-1 text-sm text-text-secondary">Sign in to your PickleCoach account</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
