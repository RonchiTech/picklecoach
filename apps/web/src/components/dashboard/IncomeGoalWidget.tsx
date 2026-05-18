'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'

type Props = {
  monthlyRevenue: number
  monthlyGoal?: number
}

export function IncomeGoalWidget({ monthlyRevenue, monthlyGoal: initialGoal }: Props) {
  const [goal, setGoal] = useState(initialGoal ?? 0)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(initialGoal ?? ''))
  const [saving, setSaving] = useState(false)

  const progress = goal > 0 ? Math.min((monthlyRevenue / goal) * 100, 100) : 0

  async function saveGoal() {
    const parsed = parseInt(draft, 10)
    if (isNaN(parsed) || parsed < 0) return
    setSaving(true)
    try {
      await apiFetch('/api/v1/auth/goal', { method: 'PATCH', body: { monthlyGoal: parsed } })
      setGoal(parsed)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-dm text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Monthly Revenue Goal
        </p>
        {!editing && (
          <button
            onClick={() => {
              setDraft(String(goal || ''))
              setEditing(true)
            }}
            className="text-xs text-accent hover:underline"
          >
            {goal > 0 ? 'Edit goal' : 'Set goal'}
          </button>
        )}
      </div>

      <p className="font-outfit text-4xl font-extralight text-text-primary">
        ₱{monthlyRevenue.toLocaleString()}
        {goal > 0 && (
          <span className="ml-2 text-lg text-text-secondary">/ ₱{goal.toLocaleString()}</span>
        )}
      </p>

      {goal > 0 && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-2 rounded-full bg-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {Math.round(progress)}% of monthly goal
          </p>
        </div>
      )}

      {editing && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-text-secondary">₱</span>
          <input
            type="number"
            min={0}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. 20000"
            className="w-36 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <button
            onClick={saveGoal}
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-base hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-muted hover:text-text-secondary"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
