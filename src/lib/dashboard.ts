import type { TransactionWithRelations } from '@/types'
//
export interface CategoryBreakdownEntry {
  categoryId: string | null
  name: string
  amount: number
  percent: number
}

export interface MonthlyTrendEntry {
  monthKey: string
  monthLabel: string
  income: number
  expense: number
}

export interface DashboardStats {
  balance: number
  monthIncome: number
  monthExpense: number
  monthRemaining: number
  categoryBreakdown: CategoryBreakdownEntry[]
}

function monthKeyOf(dateISO: string) {
  return dateISO.slice(0, 7) // 'YYYY-MM'
}


export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
}

export function currentMonthKey() {
  return new Date().toISOString().slice(0, 7)
}

export function getAvailableMonths(transactions: TransactionWithRelations[]): string[] {
  const set = new Set<string>()
  for (const t of transactions) set.add(monthKeyOf(t.date))
  return Array.from(set).sort((a, b) => (a < b ? 1 : -1))
}

export function computeDashboardStats(
  transactions: TransactionWithRelations[],
  targetMonthKey: string,
): DashboardStats {
  let balance = 0
  let monthIncome = 0
  let monthExpense = 0

  const categoryTotals = new Map<string, { categoryId: string | null; name: string; amount: number }>()

  for (const t of transactions) {
    if (t.type === 'transfer') continue

    balance += t.type === 'income' ? t.amount : -t.amount

    if (monthKeyOf(t.date) === targetMonthKey) {
      if (t.type === 'income') {
        monthIncome += t.amount
      } else {
        monthExpense += t.amount
        const key = t.category?.id ?? 'uncategorized'
        const name = t.category?.name ?? 'Uncategorized'
        const existing = categoryTotals.get(key) ?? { categoryId: t.category?.id ?? null, name, amount: 0 }
        existing.amount += t.amount
        categoryTotals.set(key, existing)
      }
    }
  }

  const categoryBreakdown: CategoryBreakdownEntry[] = Array.from(categoryTotals.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)
    .map((c) => ({
      categoryId: c.categoryId,
      name: c.name,
      amount: c.amount,
      percent: monthExpense > 0 ? (c.amount / monthExpense) * 100 : 0,
    }))

  return {
    balance,
    monthIncome,
    monthExpense,
    monthRemaining: monthIncome - monthExpense,
    categoryBreakdown,
  }
}