import { RecentTransactions } from '@/features/dashboard/RecentTransactions'
import { CategoryBreakdown } from '@/features/dashboard/CategoryBreakdown'
import { IncomeExpenseTrend } from '@/features/dashboard/IncomeExpenseTrend'

export default function AnalyticsPage() {

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



    return (
        <div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RecentTransactions transactions={monthTransactions} monthLabel={formatMonthLabel(activeMonth)} />
            <CategoryBreakdown entries={stats.categoryBreakdown} monthLabel={formatMonthLabel(activeMonth)} />
          </div>

          <IncomeExpenseTrend entries={trendEntries} />
        </div>
    );