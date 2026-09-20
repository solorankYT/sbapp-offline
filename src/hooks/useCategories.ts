import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { saveCache, loadCache } from '@/lib/offlineCache'
import type { Category } from '@/types'

export function useCategories(walletId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!walletId) {
      setCategories([])
      setLoading(false)
      return
    }

    setLoading(true)
    const cacheKey = `categories:${walletId}`

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('wallet_id', walletId)
      .order('type', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      const cached = loadCache<Category[]>(cacheKey)
      setCategories(cached ?? [])
      setLoading(false)
      return
    }

    setCategories(data ?? [])
    saveCache(cacheKey, data ?? [])
    setLoading(false)
  }, [walletId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addCategory(name: string, type: 'income' | 'expense') {
    if (!walletId) return { error: 'No wallet selected' }
    const { error } = await supabase.from('categories').insert({ wallet_id: walletId, name, type })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function renameCategory(id: string, name: string) {
    const { error } = await supabase.from('categories').update({ name }).eq('id', id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function setCategoryBudget(id: string, budgetLimit: number | null) {
    const { error } = await supabase.from('categories').update({ budget_limit: budgetLimit }).eq('id', id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  return { categories, loading, refresh, addCategory, renameCategory, deleteCategory, setCategoryBudget }
}