import { Link } from 'react-router-dom'
import { ArrowRightLeft } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import type { TransactionWithRelations } from '@/types'

export function RecentTransactions({
  transactions,
  monthLabel,
}: {
  transactions: TransactionWithRelations[]
  monthLabel: string
}) {
  const recent = transactions.slice(0, 5)

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-ink">Recent transactions</h2>
          <p className="mt-0.5 text-xs text-ink-muted">{monthLabel}</p>
        </div>
        <Link to="/transactions" className="text-xs font-medium text-pine hover:underline">
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">No transactions for this month.</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-line">
          {recent.map((t) => {
            const isTransfer = t.type === 'transfer'
            return (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  {isTransfer ? (
                    <p className="flex items-center gap-1.5 truncate text-sm text-ink">
                      {t.account?.name ?? '—'}
                      <ArrowRightLeft size={11} strokeWidth={2} className="shrink-0 text-ink-muted" />
                      {t.goal ? `Goal: ${t.goal.name}` : (t.toAccount?.name ?? '—')}
                    </p>
                  ) : (
                    <p className="truncate text-sm text-ink">{t.description || t.category?.name || 'Transaction'}</p>
                  )}
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {formatDate(t.date)}
                    {!isTransfer && t.category ? ` · ${t.category.name}` : ''}
                    {isTransfer ? ' · Transfer' : ''}
                  </p>
                </div>
                <span
                  className={`font-tabular shrink-0 text-sm font-medium ${
                    isTransfer ? 'text-ink-muted' : t.type === 'income' ? 'text-pine' : 'text-brick'
                  }`}
                >
                  {isTransfer ? '' : t.type === 'income' ? '+' : '−'}
                  {formatCurrency(t.amount)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}