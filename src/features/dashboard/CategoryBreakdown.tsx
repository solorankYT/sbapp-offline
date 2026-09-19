import type { CategoryBreakdownEntry } from '@/lib/dashboard'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'

const CATEGORY_COLORS = [
  '#8B5E58',
  '#71806A',
  '#7A8491',
  '#A08468',
  '#81758A',
  '#6F7770',
  '#9A6B55',
  '#657C82',
  '#927C5A',
  '#766A82',
  '#58756B',
  '#9B6262',
  '#6D7185',
  '#A07B62',
  '#607A6B',
  '#806A72',

  '#A66A5B',
  '#5F7480',
  '#8A7655',
  '#697B68',
  '#8B6F7A',
  '#6B6578',
  '#9C8066',
  '#5E7B73',
  '#92706A',
  '#727C8C',
  '#A18B68',
  '#63756C',
  '#856B62',
  '#70788A',
  '#98705F',
  '#5F7065',
]

function getCategoryColor(name: string) {
  let hash = 0

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const index = Math.abs(hash) % CATEGORY_COLORS.length

  return CATEGORY_COLORS[index]
}

export function CategoryBreakdown({
  monthLabel,
  entries,
  
}: {
  monthLabel: string
  entries: CategoryBreakdownEntry[]
}) {

  console.log('Category entries:', entries)
  return (
    
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4 pointer-events-none">
      {/* Header */}
      <div>
        <h2 className="text-sm font-medium text-ink">
          Expenses by category
        </h2>
         <p className="mt-0.5 text-xs text-ink-muted">{monthLabel}</p>

      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">
          No expenses logged this month yet.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Chart */}
          <div className="h-56 w-full sm:h-60 sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={entries}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="var(--surface)"
                  strokeWidth={2}
                >
                  {entries.map((entry) => (
                    <Cell
                      key={entry.categoryId ?? entry.name}
                      fill={getCategoryColor(entry.name)}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category legend */}
          <div className="w-full space-y-2 sm:w-1/2">
            {entries.map((entry) => (
              <div
                key={entry.categoryId ?? entry.name}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {/* Color indicator */}
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: getCategoryColor(entry.name),
                    }}
                  />

                  {/* Category name */}
                  <span className="truncate text-xs text-ink">
                    {entry.name}
                  </span>
                </div>

                {/* Percentage */}
                <span className="shrink-0 text-xs font-medium text-ink-muted">
                  {Math.round(entry.percent)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}