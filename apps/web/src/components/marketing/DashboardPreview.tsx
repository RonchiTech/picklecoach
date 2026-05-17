export default function DashboardPreview() {
  return (
    <div
      className="bg-surface border border-border rounded-2xl overflow-hidden mt-2"
      style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,241,53,0.06)' }}
    >
      {/* Title bar */}
      <div className="bg-[#0C0C10] border-b border-border px-5 py-3 flex gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-error" />
        <span className="w-2.5 h-2.5 rounded-full bg-warning" />
        <span className="w-2.5 h-2.5 rounded-full bg-success" />
      </div>

      {/* Body */}
      <div className="flex" style={{ minHeight: '280px' }}>
        {/* Sidebar */}
        <div className="w-14 bg-[#0C0C10] border-r border-[#1a1a24] py-3.5 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent" />
          <div className="w-8 h-8 rounded-lg bg-surface" />
          <div className="w-8 h-8 rounded-lg bg-surface" />
          <div className="w-8 h-8 rounded-lg bg-surface" />
        </div>

        {/* Main */}
        <div className="flex-1 p-4">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {statCards.map((stat) => (
              <div key={stat.label} className="bg-[#0C0C10] border border-border rounded-lg p-3">
                <p className="text-[10px] text-[#444] uppercase tracking-wide mb-1">{stat.label}</p>
                <p
                  className={'font-outfit text-xl font-bold' + (stat.accent ? ' text-accent' : '')}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] text-[#444]">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Session list */}
          <div className="bg-[#0C0C10] border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex justify-between">
              <span className="text-[10px] text-[#444] uppercase tracking-wide">
                Recent sessions
              </span>
              <span className="text-[10px] text-[#444] uppercase tracking-wide">Status</span>
            </div>
            {sessions.map((s, i) => (
              <div
                key={s.name}
                className={
                  'px-3 py-2.5 flex justify-between items-center' +
                  (i < sessions.length - 1 ? ' border-b border-white/[0.03]' : '')
                }
              >
                <div>
                  <p className="text-xs font-medium">{s.name}</p>
                  <p className="text-[10px] text-[#444]">{s.sub}</p>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: s.badgeBg, color: s.badgeColor }}
                >
                  {s.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const statCards = [
  { label: 'Today', value: '3', sub: 'sessions', accent: false },
  { label: 'Students', value: '18', sub: 'active', accent: false },
  { label: 'Unpaid', value: '₱2,400', sub: 'balance', accent: true },
]

const sessions = [
  {
    name: 'Maria Santos',
    sub: 'Private · 60 min',
    badge: 'Scheduled',
    badgeBg: 'rgba(200,241,53,0.1)',
    badgeColor: '#C8F135',
  },
  {
    name: 'Group Session A',
    sub: 'Group · 4 students',
    badge: 'Completed',
    badgeBg: 'rgba(34,197,94,0.1)',
    badgeColor: '#22c55e',
  },
  {
    name: 'Juan dela Cruz',
    sub: 'Private · 90 min',
    badge: '₱500 due',
    badgeBg: 'rgba(255,107,107,0.1)',
    badgeColor: '#ff6b6b',
  },
]
