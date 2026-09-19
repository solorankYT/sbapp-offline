import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { todayISO } from '@/lib/format'
import type { Goal } from '@/types'

export function useGoals(walletId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!walletId) {
      setGoals([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: true })

    setGoals(data ?? [])
    setLoading(false)
  }, [walletId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createGoal(name: string, targetAmount: number) {
    if (!walletId) return { error: 'No wallet selected' }
    const { error } = await supabase.from('goals').insert({ wallet_id: walletId, name, target_amount: targetAmount })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }


  async function addMoney(id: string, amount: number, userId: string, accountId: string | null) {
    const goal = goals.find((g) => g.id === id)
    if (!goal || !walletId) return { error: 'Goal not found' }

    const { error: goalError } = await supabase
      .from('goals')
      .update({ saved_amount: goal.saved_amount + amount })
      .eq('id', id)

    if (goalError) return { error: goalError.message }

    const { error: txError } = await supabase.from('transactions').insert({
      wallet_id: walletId,
      user_id: userId,
      category_id: null,
      account_id: accountId,
      to_account_id: null,
      goal_id: id,
      type: 'transfer',
      amount,
      description: `Added to goal: ${goal.name}`,
      date: todayISO(),
      is_recurring: false,
    })

    if (txError) return { error: `Saved to goal, but couldn't log the transaction: ${txError.message}` }

    await refresh()
    return { error: null }
  }

  async function deleteGoal(id: string) {
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  return { goals, loading, refresh, createGoal, addMoney, deleteGoal }
}