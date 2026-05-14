export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-base">
      <aside className="w-52 border-r border-border flex-shrink-0 p-4">
        <span className="font-outfit font-bold text-accent text-lg">PC</span>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
