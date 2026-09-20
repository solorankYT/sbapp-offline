import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { saveCache, loadCache } from '@/lib/offlineCache'

interface BalanceTransaction {
  type: 'income' | 'expense' | 'transfer'
  amount: number
  account_id: string | null
  to_account_id: string | null
}

export function useAccountBalances(walletId: string | undefined) {
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const calculateBalances = useCallback(
    (transactions: BalanceTransaction[]) => {
      const totals: Record<string, number> = {}

      const add = (accountId: string | null, delta: number) => {
        if (!accountId) return

        totals[accountId] = (totals[accountId] ?? 0) + delta
      }

      for (const t of transactions) {
        if (t.type === 'income') {
          add(t.account_id, t.amount)
        } else if (t.type === 'expense') {
          add(t.account_id, -t.amount)
        } else if (t.type === 'transfer') {
          add(t.account_id, -t.amount)
          add(t.to_account_id, t.amount)
        }
      }

      return totals
    },
    [],
  )

  const refresh = useCallback(async () => {
    if (!walletId) {
      setBalances({})
      setLoading(false)
      return
    }

    const cacheKey = `account-balances-transactions:${walletId}`

    // 1. Load cached transactions first
    const cached = loadCache<BalanceTransaction[]>(cacheKey)

    if (cached) {
      const cachedBalances = calculateBalances(cached)

      setBalances(cachedBalances)
      setLoading(false)
    }

    // 2. Fetch fresh transaction data in the background
    const { data, error } = await supabase
      .from('transactions')
      .select('type, amount, account_id, to_account_id')
      .eq('wallet_id', walletId)

    // 3. If offline/error, keep cached balances
    if (error) {
      if (cached) {
        setLoading(false)
        return
      }

      setBalances({})
      setLoading(false)
      return
    }

    // 4. Calculate balances from fresh data
    const transactions = (data ?? []) as BalanceTransaction[]
    const freshBalances = calculateBalances(transactions)

    setBalances(freshBalances)

    // 5. Cache the transaction data used for balances
    saveCache(cacheKey, transactions)

    setLoading(false)
  }, [walletId, calculateBalances])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    balances,
    loading,
    refresh,
  }
}