import { ChevronLeft, ChevronRight } from 'lucide-react'

function shiftMonth(monthKey: string, delta: number) {
  const [year, month] = monthKey.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function MonthSelector({ monthKey, onChange }: { monthKey: string; onChange: (next: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(monthKey, -1))}
        aria-label="Previous month"
        className="rounded-[var(--radius-card)] border border-line bg-surface p-1.5 text-ink-muted hover:text-ink"
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      <span className="min-w-[9rem] text-center text-sm font-medium text-ink">{monthLabel(monthKey)}</span>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(monthKey, 1))}
        aria-label="Next month"
        className="rounded-[var(--radius-card)] border border-line bg-surface p-1.5 text-ink-muted hover:text-ink"
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  )
}