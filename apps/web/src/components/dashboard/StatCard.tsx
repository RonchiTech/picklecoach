type StatCardProps = {
  value: number
  label: string
  prefix?: string
}

export function StatCard({ value, label, prefix = '' }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <p className="font-outfit text-6xl font-extralight text-text-primary">
        {prefix}
        {value.toLocaleString()}
      </p>
      <p className="mt-3 font-dm text-xs font-semibold uppercase tracking-widest text-text-secondary">
        {label}
      </p>
    </div>
  )
}
