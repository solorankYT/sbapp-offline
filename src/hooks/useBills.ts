import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { todayISO } from '@/lib/format'
import type { Bill } from '@/types'

export interface NewBill {
  name: string
  amount: number
  categoryId: string | null
  accountId: string | null
  dueDay: number
  billType: string
}

function currentMonthRange() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().slice(0, 10)
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1)).toISOString().slice(0, 10)
  return { start, end }
}

export function useBills(walletId: string | undefined) {
  const [bills, setBills] = useState<Bill[]>([])
  const [paidBillIds, setPaidBillIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!walletId) {
      setBills([])
      setPaidBillIds(new Set())
      setLoading(false)
      return
    }

    setLoading(true)
    const { start, end } = currentMonthRange()

    const [billsResult, paymentsResult] = await Promise.all([
      supabase.from('bills').select('*').eq('wallet_id', walletId).order('due_day', { ascending: true }),
      supabase
        .from('transactions')
        .select('bill_id')
        .eq('wallet_id', walletId)
        .not('bill_id', 'is', null)
        .gte('date', start)
        .lt('date', end),
    ])

    setBills(billsResult.data ?? [])
    setPaidBillIds(new Set((paymentsResult.data ?? []).map((t) => t.bill_id as string)))
    setLoading(false)
  }, [walletId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createBill(input: NewBill) {
    if (!walletId) return { error: 'No wallet selected' }
    const { error } = await supabase.from('bills').insert({
      wallet_id: walletId,
      name: input.name,
      amount: input.amount,
      category_id: input.categoryId,
      account_id: input.accountId,
      due_day: input.dueDay,
      bill_type: input.billType,
    })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function updateBill(id: string, input: NewBill) {
    const { error } = await supabase
      .from('bills')
      .update({
        name: input.name,
        amount: input.amount,
        category_id: input.categoryId,
        account_id: input.accountId,
        due_day: input.dueDay,
        bill_type: input.billType,
      })
      .eq('id', id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function deleteBill(id: string) {
    const { error } = await supabase.from('bills').delete().eq('id', id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  // Marking a bill paid is just a normal expense transaction tagged with
  // bill_id — no special transfer logic needed, since paying a bill really
  // is spending money (unlike goal/debt contributions, which are transfers).
  async function markAsPaid(bill: Bill, amount: number, accountId: string | null, userId: string) {
    if (!walletId) return { error: 'No wallet selected' }

    const { error } = await supabase.from('transactions').insert({
      wallet_id: walletId,
      user_id: userId,
      category_id: bill.category_id,
      account_id: accountId,
      bill_id: bill.id,
      type: 'expense',
      amount,
      description: bill.name,
      date: todayISO(),
      is_recurring: false,
    })

    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  return { bills, paidBillIds, loading, refresh, createBill, updateBill, deleteBill, markAsPaid }
}