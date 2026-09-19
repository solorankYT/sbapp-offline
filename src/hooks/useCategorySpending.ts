import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function currentMonthRange() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().slice(0, 10)
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1)).toISOString().slice(0, 10)
  return { start, end }
}

// Keyed by category_id -> total spent this month. No month picker here on
// purpose — category budget limits are static, so "spent" always just means
// "so far this calendar month", computed fresh from transactions.
export function useCategorySpending(walletId: string | undefined) {
  const [spendingByCategory, setSpendingByCategory] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!walletId) {
      setSpendingByCategory({})
      setLoading(false)
      return
    }

    setLoading(true)
    const { start, end } = currentMonthRange()

    const { data } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('wallet_id', walletId)
      .eq('type', 'expense')
      .gte('date', start)
      .lt('date', end)

    const totals: Record<string, number> = {}
    for (const t of data ?? []) {
      if (!t.category_id) continue
      totals[t.category_id] = (totals[t.category_id] ?? 0) + t.amount
    }

    setSpendingByCategory(totals)
    setLoading(false)
  }, [walletId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { spendingByCategory, loading, refresh }
}