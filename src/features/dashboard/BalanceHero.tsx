import { formatCurrency } from '@/lib/format'

export function BalanceHero({ balance }: { balance: number }) {
  const isNegative = balance < 0

  return (
    <div className="min-w-0 rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Current balance</p>
      <p className={`mt-2 truncate font-tabular font-display text-3xl sm:text-4xl ${isNegative ? 'text-brick' : 'text-ink'}`}>
        {formatCurrency(balance)}
      </p>
    </div>
  )
}