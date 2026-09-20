import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { saveCache, loadCache } from '@/lib/offlineCache'
import type { Account } from '@/types'
import type { AccountProviderId } from '@/lib/accountProviders'

export interface AccountInput {
  name: string
  provider: AccountProviderId
  color: string | null
  iconUrl: string | null
}

export function useAccounts(walletId: string | undefined) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!walletId) {
      setAccounts([])
      setLoading(false)
      return
    }

    setLoading(true)
    const cacheKey = `accounts:${walletId}`

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: true })

    if (error) {
      const cached = loadCache<Account[]>(cacheKey)
      setAccounts(cached ?? [])
      setLoading(false)
      return
    }

    setAccounts(data ?? [])
    saveCache(cacheKey, data ?? [])
    setLoading(false)
  }, [walletId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createAccount(input: AccountInput) {
    if (!walletId) return { error: 'No wallet selected' }
    const { error } = await supabase.from('accounts').insert({
      wallet_id: walletId,
      name: input.name,
      provider: input.provider,
      color: input.color,
      icon_url: input.iconUrl,
    })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function updateAccount(id: string, input: AccountInput) {
    const { error } = await supabase
      .from('accounts')
      .update({ name: input.name, provider: input.provider, color: input.color, icon_url: input.iconUrl })
      .eq('id', id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function deleteAccount(id: string) {
    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  return { accounts, loading, refresh, createAccount, updateAccount, deleteAccount }
}