import { formatCurrency } from '@/lib/format'

function StatCard({ label, value, tone = 'ink' }: { label: string; value: number; tone?: 'ink' | 'pine' | 'brick' }) {
  const toneClass = tone === 'pine' ? 'text-pine' : tone === 'brick' ? 'text-brick' : 'text-ink'

  return (
    <div className="min-w-0 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1.5 truncate font-tabular font-display text-lg sm:text-xl ${toneClass}`}>
        {formatCurrency(value)}
      </p>
    </div>
  )
}


export function DashboardStatCards({
  monthIncome,
  monthExpense,
}: {
  monthIncome: number
  monthExpense: number
}) {
  return (
    <div className="grid grid-cols-2 gap-3 ">
      <StatCard label="Income" value={monthIncome} tone="pine" />
      <StatCard label="Expenses" value={monthExpense} tone="brick" />
    </div>
  )
}