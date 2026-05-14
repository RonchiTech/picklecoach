export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-outfit text-3xl font-bold text-white">
            Pickle<span className="text-accent">Coach</span>
          </h1>
        </div>
        {children}
      </div>
    </div>
  )
}
