

export default function AnalyticsPage() {
    return (
        <div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RecentTransactions transactions={monthTransactions} monthLabel={formatMonthLabel(activeMonth)} />
            <CategoryBreakdown entries={stats.categoryBreakdown} monthLabel={formatMonthLabel(activeMonth)} />
          </div>

          <IncomeExpenseTrend entries={trendEntries} />
        </div>
    );