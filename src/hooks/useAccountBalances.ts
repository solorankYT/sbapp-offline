import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Keyed by account_id -> current balance. Deliberately uncapped (unlike the
// 300-row recent-transactions list used elsewhere) — a balance has to be
// exactly right, not just "recent enough".
export function useAccountBalances(walletId: string | undefined) {
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!walletId) {
      setBalances({})
      setLoading(false)
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('type, amount, account_id, to_account_id')
      .eq('wallet_id', walletId)

    const totals: Record<string, number> = {}
    const add = (accountId: string | null, delta: number) => {
      if (!accountId) return
      totals[accountId] = (totals[accountId] ?? 0) + delta
    }

    for (const t of data ?? []) {
      if (t.type === 'income') add(t.account_id, t.amount)
      else if (t.type === 'expense') add(t.account_id, -t.amount)
      else if (t.type === 'transfer') {
        add(t.account_id, -t.amount)
        add(t.to_account_id, t.amount)
      }
    }

    setBalances(totals)
    setLoading(false)
  }, [walletId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { balances, loading, refresh }
}