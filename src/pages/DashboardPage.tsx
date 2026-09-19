import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@/hooks/useWallet'
import { useTransactions } from '@/hooks/useTransactions'
import { computeDashboardStats, getAvailableMonths, currentMonthKey, formatMonthLabel } from '@/lib/dashboard'
import { BalanceHero } from '@/features/dashboard/BalanceHero'
import { DashboardStatCards } from '@/features/dashboard/DashboardStatCards'
import { DashboardMoreHub } from '@/features/dashboard/DashboardMoreHub'
import { RecentTransactions } from '@/features/dashboard/RecentTransactions'
import { CategoryBreakdown } from '@/features/dashboard/CategoryBreakdown'
import { IncomeExpenseTrend } from '@/features/dashboard/IncomeExpenseTrend'
import { DashboardSkeleton } from '@/features/dashboard/DashboardSkeleton'
import { MonthPicker } from '@/features/dashboard/MonthPicker'
import { UserCircle } from 'lucide-react';
import { UpcomingBills } from '@/features/dashboard/UpcomingBills'

export function DashboardPage() {
  const { currentWallet, loading: walletLoading, wallets } = useWallet()
  const { transactions, loading: transactionsLoading } = useTransactions(currentWallet?.id)

  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions])
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  useEffect(() => {
    if (selectedMonth !== null || availableMonths.length === 0) return
    const nowKey = currentMonthKey()
    setSelectedMonth(availableMonths.includes(nowKey) ? nowKey : availableMonths[0])
  }, [availableMonths, selectedMonth])

  const activeMonth = selectedMonth ?? currentMonthKey()
  const stats = useMemo(() => computeDashboardStats(transactions, activeMonth), [transactions, activeMonth])

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date.slice(0, 7) === activeMonth),
    [transactions, activeMonth],
  )

  const trendEntries = useMemo(
    () => [
      {
        monthKey: activeMonth,
        monthLabel: formatMonthLabel(activeMonth),
        income: stats.monthIncome,
        expense: stats.monthExpense,
      },
    ],
    [activeMonth, stats.monthIncome, stats.monthExpense],
  )

  if (walletLoading) return null

  if (!currentWallet) {
    return (
      <div>
        <h1 className="font-display text-2xl text-ink">Dashboard</h1>
        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-muted">
            {wallets.length === 0
              ? 'Create your first wallet to start tracking spending.'
              : 'Select a wallet to see its dashboard.'}
          </p>
          {wallets.length === 0 ? (
            <Link to="/wallets" className="mt-3 inline-block text-sm font-medium text-pine hover:underline">
              Create a wallet
            </Link>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
   
        
        {!transactionsLoading ? (
          <MonthPicker months={availableMonths} value={activeMonth} onChange={setSelectedMonth} />
        ) : null}

        <Link to="/settings" className="text-sm font-medium text-ink-muted hover:underline">
          <UserCircle size={30} className="mr-1 inline-block" />
        </Link>
       
        
      </div>

      {transactionsLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <BalanceHero balance={stats.balance} />

          <DashboardStatCards monthIncome={stats.monthIncome} monthExpense={stats.monthExpense} />

          
          <DashboardMoreHub />

          <UpcomingBills walletId={currentWallet.id} />


          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RecentTransactions transactions={monthTransactions} monthLabel={formatMonthLabel(activeMonth)} />
            <CategoryBreakdown entries={stats.categoryBreakdown} monthLabel={formatMonthLabel(activeMonth)} />
          </div>

          <IncomeExpenseTrend entries={trendEntries} />
        </div>
      )}
    </div>
  )
}