import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { todayISO } from '@/lib/format'
import { saveCache, loadCache } from '@/lib/offlineCache'
import type { Debt } from '@/types'

export type DebtDirection = 'owed_to_me' | 'i_owe'

export interface NewDebt {
  personName: string
  direction: DebtDirection
  amount: number
  description: string
  dueDate: string | null
  accountId: string | null
}

export function useDebts(walletId: string | undefined) {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!walletId) {
      setDebts([])
      setLoading(false)
      return
    }

    const cacheKey = `debts:${walletId}`

    // ---------------------------------------------------------
    // 1. Load cached debts immediately
    // ---------------------------------------------------------

    const cached = loadCache<Debt[]>(cacheKey)

    if (cached) {
      setDebts(cached)
      setLoading(false)
    }

    // ---------------------------------------------------------
    // 2. Fetch fresh debts from Supabase
    // ---------------------------------------------------------

    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })

    // ---------------------------------------------------------
    // 3. If Supabase fails, keep cached debts
    // ---------------------------------------------------------

    if (error) {
      if (cached) {
        setLoading(false)
        return
      }

      setDebts([])
      setLoading(false)
      return
    }

    // ---------------------------------------------------------
    // 4. Update state and cache with fresh data
    // ---------------------------------------------------------

    const freshDebts = data ?? []

    setDebts(freshDebts)
    saveCache(cacheKey, freshDebts)

    setLoading(false)
  }, [walletId])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Creating a debt can optionally move real money: lending cash means it
  // leaves an account (account_id set), borrowing means it enters one
  // (to_account_id set) — same shape the transfer/goal features already use,
  // so it's excluded from income/expense stats and reflected in balances.
  async function createDebt(input: NewDebt, userId: string) {
    if (!walletId) return { error: 'No wallet selected' }

    const { data: debt, error: debtError } = await supabase
      .from('debts')
      .insert({
        wallet_id: walletId,
        person_name: input.personName,
        direction: input.direction,
        amount: input.amount,
        description: input.description || null,
        due_date: input.dueDate,
      })
      .select()
      .single()

    if (debtError || !debt) {
      return {
        error: debtError?.message ?? 'Could not create debt',
      }
    }

    if (input.accountId) {
      const isLending = input.direction === 'owed_to_me'

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          wallet_id: walletId,
          user_id: userId,
          category_id: null,
          account_id: isLending ? input.accountId : null,
          to_account_id: isLending ? null : input.accountId,
          debt_id: debt.id,
          type: 'transfer',
          amount: input.amount,
          description: `${isLending ? 'Lent to' : 'Borrowed from'} ${input.personName}`,
          date: todayISO(),
          is_recurring: false,
        })

      if (txError) {
        await refresh()

        return {
          error: `Debt saved, but couldn't log the account movement: ${txError.message}`,
        }
      }
    }

    await refresh()

    return { error: null }
  }

  // Repayment moves money the opposite way: someone repaying you enters an
  // account, you repaying someone leaves one.
  async function recordPayment(
    debtId: string,
    amount: number,
    accountId: string | null,
    userId: string,
  ) {
    const debt = debts.find((d) => d.id === debtId)

    if (!debt || !walletId) {
      return { error: 'Debt not found' }
    }

    const { error: updateError } = await supabase
      .from('debts')
      .update({
        paid_amount: debt.paid_amount + amount,
      })
      .eq('id', debtId)

    if (updateError) {
      return { error: updateError.message }
    }

    if (accountId) {
      const isReceiving = debt.direction === 'owed_to_me'

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          wallet_id: walletId,
          user_id: userId,
          category_id: null,
          account_id: isReceiving ? null : accountId,
          to_account_id: isReceiving ? accountId : null,
          debt_id: debtId,
          type: 'transfer',
          amount,
          description: `${isReceiving ? 'Repayment from' : 'Payment to'} ${debt.person_name}`,
          date: todayISO(),
          is_recurring: false,
        })

      if (txError) {
        await refresh()

        return {
          error: `Payment recorded, but couldn't log the account movement: ${txError.message}`,
        }
      }
    }

    await refresh()

    return { error: null }
  }

  async function updateDebt(
    id: string,
    input: {
      personName: string
      description: string
      dueDate: string | null
    },
  ) {
    const { error } = await supabase
      .from('debts')
      .update({
        person_name: input.personName,
        description: input.description || null,
        due_date: input.dueDate,
      })
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    await refresh()

    return { error: null }
  }

  async function deleteDebt(id: string) {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    await refresh()

    return { error: null }
  }

  async function updatePayment(
    debtId: string,
    transactionId: string,
    oldAmount: number,
    newAmount: number,
    accountId: string | null,
    date: string,
    note: string,
  ) {
    const debt = debts.find((d) => d.id === debtId)

    if (!debt || !walletId) {
      return { error: 'Debt not found' }
    }

    const isReceiving = debt.direction === 'owed_to_me'

    const { error: txError } = await supabase
      .from('transactions')
      .update({
        amount: newAmount,
        account_id: isReceiving ? null : accountId,
        to_account_id: isReceiving ? accountId : null,
        date,
        description:
          note ||
          `${isReceiving ? 'Repayment from' : 'Payment to'} ${debt.person_name}`,
      })
      .eq('id', transactionId)

    if (txError) {
      return { error: txError.message }
    }

    const delta = newAmount - oldAmount

    if (delta !== 0) {
      const { error: debtError } = await supabase
        .from('debts')
        .update({
          paid_amount: Math.max(debt.paid_amount + delta, 0),
        })
        .eq('id', debtId)

      if (debtError) {
        return { error: debtError.message }
      }
    }

    await refresh()

    return { error: null }
  }

  // Deleting a payment must reverse its effect on paid_amount too.
  async function deletePayment(
    debtId: string,
    transactionId: string,
    amount: number,
  ) {
    const debt = debts.find((d) => d.id === debtId)

    if (!debt) {
      return { error: 'Debt not found' }
    }

    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)

    if (txError) {
      return { error: txError.message }
    }

    const { error: debtError } = await supabase
      .from('debts')
      .update({
        paid_amount: Math.max(debt.paid_amount - amount, 0),
      })
      .eq('id', debtId)

    if (debtError) {
      return { error: debtError.message }
    }

    await refresh()

    return { error: null }
  }

  return {
    debts,
    loading,
    refresh,
    createDebt,
    recordPayment,
    updateDebt,
    deleteDebt,
    updatePayment,
    deletePayment,
  }
}