import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { enqueueTransaction, getQueueForWallet, removeFromQueue, type QueuedTransaction } from '@/lib/offlineQueue'
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

  const refresh = useCallback(async () => {
    if (!walletId) {
      setTransactions([])
      setPending([])
      setLoading(false)
      return
    }

    setPending(getQueueForWallet(walletId))
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('transactions')
      .select(SELECT_WITH_RELATIONS)
      .eq('wallet_id', walletId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (fetchError) {
      // Likely offline — keep showing whatever we already had rather than
      // clearing the list, and surface the pending queue so entry still works.
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setTransactions((data ?? []) as unknown as TransactionWithRelations[])
    setLoading(false)
  }, [walletId])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Turns a queued item into a fake TransactionWithRelations so it shows up
  // in lists immediately, tagged so the UI can mark it "Pending sync".
  function toPendingDisplay(item: QueuedTransaction): TransactionWithRelations {
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
      debt: null,
      profile: user ? { id: user.id, full_name: null, email: user.email ?? null } : null,
    }
  }

  const transactionsWithPending = [...pending.map(toPendingDisplay), ...transactions]

  async function addTransaction(input: NewTransaction) {
    if (!walletId || !user) return { error: 'No wallet selected' }

    if (!navigator.onLine) {
      enqueueTransaction(walletId, input)
      setPending(getQueueForWallet(walletId))
      return { error: null }
    }

    const { error: insertError } = await supabase.from('transactions').insert({
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
      // Covers the case where navigator.onLine lied (some browsers report
      // online even on a dead connection) — fall back to queueing instead
      // of losing what the user typed.
      enqueueTransaction(walletId, input)
      setPending(getQueueForWallet(walletId))
      return { error: null }
    }

    await refresh()
    return { error: null }
  }

  async function syncPending() {
    if (!walletId || !user || !navigator.onLine) return

    const queue = getQueueForWallet(walletId)
    for (const item of queue) {
      const { error: insertError } = await supabase.from('transactions').insert({
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

      // Only remove from the queue on success — leave failures queued to
      // retry next time (e.g. connection drops mid-sync).
      if (!insertError) removeFromQueue(item.localId)
    }

    await refresh()
  }

  async function updateTransaction(id: string, input: NewTransaction) {
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

    if (updateError) return { error: updateError.message }
    await refresh()
    return { error: null }
  }

  // A transfer is a single row: account_id is the source, to_account_id is
  // the destination. It's never treated as income or expense (see
  // lib/dashboard.ts, which skips type === 'transfer' entirely).
  async function addTransfer(input: NewTransfer) {
    if (!walletId || !user) return { error: 'No wallet selected' }
    if (input.fromAccountId === input.toAccountId) {
      return { error: 'Choose two different accounts.' }
    }

    const { error: insertError } = await supabase.from('transactions').insert({
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

    if (insertError) return { error: insertError.message }
    await refresh()
    return { error: null }
  }

    async function updateTransfer(id: string, input: NewTransfer) {
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

    if (updateError) return { error: updateError.message }
    await refresh()
    return { error: null }
  }
    // Balance corrections use the same untracked-counterpart pattern as goal
  // and debt contributions: one side is a real account, the other is left
  // null. We deliberately don't know whether the gap was forgotten income or
  // forgotten spending, so — like all transfers — it's excluded from
  // Income/Expense stats rather than guessing and skewing them.
  async function adjustBalance(accountId: string, difference: number, note: string) {
    if (!walletId || !user) return { error: 'No wallet selected' }
    if (difference === 0) return { error: 'That matches the current balance already.' }

    const isIncrease = difference > 0
    const { error: insertError } = await supabase.from('transactions').insert({
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

    if (insertError) return { error: insertError.message }
    await refresh()
    return { error: null }
  }

  async function deleteTransaction(id: string) {
    const { error: deleteError } = await supabase.from('transactions').delete().eq('id', id)
    if (deleteError) return { error: deleteError.message }
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