import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  enqueueTransaction,
  getQueueForWallet,
  removeFromQueue,
  type QueuedTransaction,
} from '@/lib/offlineQueue'
import { saveCache, loadCache } from '@/lib/offlineCache'
import type { TransactionWithRelations } from '@/types'

export interface NewTransaction {
  type: 'income' | 'expense'
  amount: number
  categoryId: string | null
  accountId: string | null
  description: string
  date: string
  isRecurring: boolean
}

export interface NewTransfer {
  fromAccountId: string
  toAccountId: string
  amount: number
  description: string
  date: string
}

const PAGE_SIZE = 300

const todayISO = () => new Date().toISOString().slice(0, 10)

const SELECT_WITH_RELATIONS =
  '*, category:categories(id, name, type), ' +
  'account:accounts!transactions_account_id_fkey(id, name, provider, color, icon_url), ' +
  'toAccount:accounts!transactions_to_account_id_fkey(id, name, provider, color, icon_url), ' +
  'debt:debts(id, person_name, direction), ' +
  'profile:profiles(id, full_name, email)'

export function useTransactions(walletId: string | undefined) {
  const { user } = useAuth()

  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [pending, setPending] = useState<QueuedTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const syncingRef = useRef(false)

  const refresh = useCallback(async () => {
    if (!walletId) {
      setTransactions([])
      setPending([])
      setLoading(false)
      return
    }

    const cacheKey = `transactions:${walletId}`

    // Always restore pending queue first.
    setPending(getQueueForWallet(walletId))

    // ---------------------------------------------------------
    // 1. Load cached transactions immediately
    // ---------------------------------------------------------

    const cached = loadCache<TransactionWithRelations[]>(cacheKey)

    if (cached) {
      setTransactions(cached)
      setLoading(false)
      setError(null)
    }

    // ---------------------------------------------------------
    // 2. Fetch fresh transactions in the background
    // ---------------------------------------------------------

    const { data, error: fetchError } = await supabase
      .from('transactions')
      .select(SELECT_WITH_RELATIONS)
      .eq('wallet_id', walletId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    // ---------------------------------------------------------
    // 3. If offline/error, keep cached transactions
    // ---------------------------------------------------------

    if (fetchError) {
      if (cached) {
        setError(null)
        setLoading(false)
        return
      }

      setTransactions([])
      setError(fetchError.message)
      setLoading(false)
      return
    }

    // ---------------------------------------------------------
    // 4. Replace cache with fresh transactions
    // ---------------------------------------------------------

    const freshTransactions =
      (data ?? []) as unknown as TransactionWithRelations[]

    setTransactions(freshTransactions)
    saveCache(cacheKey, freshTransactions)

    setError(null)
    setLoading(false)
  }, [walletId])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Turns a queued item into a fake TransactionWithRelations so it shows up
  // in lists immediately, tagged so the UI can mark it "Pending sync".
  function toPendingDisplay(
    item: QueuedTransaction,
  ): TransactionWithRelations {
    return {
      id: `pending:${item.localId}`,
      wallet_id: item.walletId,
      user_id: user?.id ?? '',
      category_id: item.input.categoryId,
      account_id: item.input.accountId,
      to_account_id: null,
      goal_id: null,
      debt_id: null,
      bill_id: null,
      type: item.input.type,
      amount: item.input.amount,
      description: item.input.description || null,
      date: item.input.date,
      is_recurring: item.input.isRecurring,
      created_at: item.queuedAt,
      category: null,
      account: null,
      toAccount: null,
      goal: null,
      debt: null,
      profile: user
        ? {
            id: user.id,
            full_name: null,
            email: user.email ?? null,
          }
        : null,
    }
  }

  const transactionsWithPending = [
    ...pending.map(toPendingDisplay),
    ...transactions,
  ]

  async function addTransaction(input: NewTransaction) {
    if (!walletId || !user) {
      return { error: 'No wallet selected' }
    }

    if (!navigator.onLine) {
      enqueueTransaction(walletId, input)
      setPending(getQueueForWallet(walletId))

      return { error: null }
    }

    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: walletId,
        user_id: user.id,
        category_id: input.categoryId,
        account_id: input.accountId,
        type: input.type,
        amount: input.amount,
        description: input.description || null,
        date: input.date,
        is_recurring: input.isRecurring,
      })

    if (insertError) {
      // Covers cases where navigator.onLine says we're online
      // but the actual connection is unavailable.
      enqueueTransaction(walletId, input)
      setPending(getQueueForWallet(walletId))

      return { error: null }
    }

    await refresh()

    return { error: null }
  }

 async function syncPending() {
  if (!walletId || !user || !navigator.onLine) return

  // Prevent two sync operations from running at the same time.
  if (syncingRef.current) return

  syncingRef.current = true

  try {
    const queue = getQueueForWallet(walletId)

    for (const item of queue) {
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          wallet_id: walletId,
          user_id: user.id,
          category_id: item.input.categoryId,
          account_id: item.input.accountId,
          type: item.input.type,
          amount: item.input.amount,
          description: item.input.description || null,
          date: item.input.date,
          is_recurring: item.input.isRecurring,
        })

      // Only remove after Supabase confirms the insert succeeded.
      if (!insertError) {
        removeFromQueue(item.localId)
      }
    }

    // Refresh database data and update transaction cache.
    await refresh()
  } finally {
    syncingRef.current = false
  }
}

  async function updateTransaction(
    id: string,
    input: NewTransaction,
  ) {
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        category_id: input.categoryId,
        account_id: input.accountId,
        type: input.type,
        amount: input.amount,
        description: input.description || null,
        date: input.date,
        is_recurring: input.isRecurring,
      })
      .eq('id', id)

    if (updateError) {
      return { error: updateError.message }
    }

    await refresh()

    return { error: null }
  }

  // A transfer is a single row:
  // account_id = source
  // to_account_id = destination
  async function addTransfer(input: NewTransfer) {
    if (!walletId || !user) {
      return { error: 'No wallet selected' }
    }

    if (input.fromAccountId === input.toAccountId) {
      return { error: 'Choose two different accounts.' }
    }

    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: walletId,
        user_id: user.id,
        category_id: null,
        account_id: input.fromAccountId,
        to_account_id: input.toAccountId,
        type: 'transfer',
        amount: input.amount,
        description: input.description || null,
        date: input.date,
        is_recurring: false,
      })

    if (insertError) {
      return { error: insertError.message }
    }

    await refresh()

    return { error: null }
  }

  async function updateTransfer(
    id: string,
    input: NewTransfer,
  ) {
    if (input.fromAccountId === input.toAccountId) {
      return { error: 'Choose two different accounts.' }
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        account_id: input.fromAccountId,
        to_account_id: input.toAccountId,
        amount: input.amount,
        description: input.description || null,
        date: input.date,
      })
      .eq('id', id)

    if (updateError) {
      return { error: updateError.message }
    }

    await refresh()

    return { error: null }
  }

  // Balance corrections use the same untracked-counterpart pattern
  // as goal and debt contributions.
  async function adjustBalance(
    accountId: string,
    difference: number,
    note: string,
  ) {
    if (!walletId || !user) {
      return { error: 'No wallet selected' }
    }

    if (difference === 0) {
      return { error: 'That matches the current balance already.' }
    }

    const isIncrease = difference > 0

    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: walletId,
        user_id: user.id,
        category_id: null,
        account_id: isIncrease ? null : accountId,
        to_account_id: isIncrease ? accountId : null,
        type: 'transfer',
        amount: Math.abs(difference),
        description: note || 'Balance correction',
        date: todayISO(),
        is_recurring: false,
      })

    if (insertError) {
      return { error: insertError.message }
    }

    await refresh()

    return { error: null }
  }

  async function deleteTransaction(id: string) {
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return { error: deleteError.message }
    }

    await refresh()

    return { error: null }
  }

  return {
    transactions: transactionsWithPending,
    loading,
    error,
    refresh,
    addTransaction,
    updateTransaction,
    addTransfer,
    updateTransfer,
    adjustBalance,
    deleteTransaction,
    syncPending,
    hasPending: pending.length > 0,
  }
}