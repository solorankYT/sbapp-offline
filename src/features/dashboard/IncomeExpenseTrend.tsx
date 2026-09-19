import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { formatCompactNumber, formatCurrency } from '@/lib/format'
import type { MonthlyTrendEntry } from '@/lib/dashboard'

export function IncomeExpenseTrend({ entries }: { entries: MonthlyTrendEntry[] }) {
  const totalIncome = entries.reduce((sum, entry) => sum + entry.income, 0)
  const totalExpense = entries.reduce((sum, entry) => sum + entry.expense, 0)

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-ink">Income vs expenses</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Monthly overview
          </p>
        </div>

        <div className="flex gap-2">
          {/* Income */}
          <div className="rounded-md bg-pine/10 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-pine" />
              <span className="text-xs text-ink-muted">Income</span>
            </div>
            <p className="mt-0.5 text-sm font-semibold text-pine">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          {/* Expense */}
          <div className="rounded-md bg-brick/10 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brick" />
              <span className="text-xs text-ink-muted">Expense</span>
            </div>
            <p className="mt-0.5 text-sm font-semibold text-brick">
              {formatCurrency(totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">
          Not enough data yet.
        </p>
      ) : (
        <div className="pointer-events-none mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={entries}
              margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--color-line)"
              />

              <XAxis
                dataKey="monthLabel"
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: 'var(--color-ink-muted)',
                  fontSize: 12,
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: 'var(--color-ink-muted)',
                  fontSize: 11,
                }}
                tickFormatter={(value) =>
                  formatCompactNumber(Number(value))
                }
                width={36}
              />

              <Bar
                dataKey="income"
                fill="var(--color-pine)"
                radius={[3, 3, 0, 0]}
                maxBarSize={18}
              />

              <Bar
                dataKey="expense"
                fill="var(--color-brick)"
                radius={[3, 3, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}