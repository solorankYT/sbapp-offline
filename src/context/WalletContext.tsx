import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { WalletWithRole } from '@/types'

const ACTIVE_WALLET_KEY = 'ledger:active-wallet-id'

interface WalletContextValue {
  wallets: WalletWithRole[]
  currentWallet: WalletWithRole | null
  loading: boolean
  error: string | null
  setCurrentWalletId: (id: string) => void
  refresh: () => Promise<void>
  createWallet: (name: string, description?: string) => Promise<{ error: string | null }>
  renameWallet: (id: string, name: string, description?: string) => Promise<{ error: string | null }>
  deleteWallet: (id: string) => Promise<{ error: string | null }>
}

export const WalletContext = createContext<WalletContextValue | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [wallets, setWallets] = useState<WalletWithRole[]>([])
  const [currentWalletId, setCurrentWalletIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setCurrentWalletId = useCallback((id: string) => {
    setCurrentWalletIdState(id)
    localStorage.setItem(ACTIVE_WALLET_KEY, id)
  }, [])

  const refresh = useCallback(async () => {
    if (!user) {
      setWallets([])
      setLoading(false)
      return
    }

    setError(null)

    const { data, error: fetchError } = await supabase
      .from('wallets')
      .select('*, wallet_members(user_id, role)')
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    const withRole: WalletWithRole[] = (data ?? []).map((w) => {
      const members = w.wallet_members as { user_id: string; role: 'owner' | 'member' }[]
      const mine = members.find((m) => m.user_id === user.id)
      return {
        id: w.id,
        name: w.name,
        description: w.description,
        owner_id: w.owner_id,
        created_at: w.created_at,
        role: mine?.role ?? 'member',
        memberCount: members.length,
      }
    })

    setWallets(withRole)

    setCurrentWalletIdState((prev) => {
      const stored = prev ?? localStorage.getItem(ACTIVE_WALLET_KEY)
      const stillExists = withRole.some((w) => w.id === stored)
      const next = stillExists ? stored! : (withRole[0]?.id ?? null)
      if (next) localStorage.setItem(ACTIVE_WALLET_KEY, next)
      return next
    })

    setLoading(false)
  }, [user])

  useEffect(() => {
    setLoading(true)
    refresh()
  }, [refresh])

  async function createWallet(name: string, description?: string) {
    if (!user) return { error: 'Not signed in' }

    const { data, error: insertError } = await supabase
      .from('wallets')
      .insert({ name, description: description || null, owner_id: user.id })
      .select()
      .single()

    if (insertError) return { error: insertError.message }

    await refresh()
    if (data) setCurrentWalletId(data.id)
    return { error: null }
  }

  async function renameWallet(id: string, name: string, description?: string) {
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ name, description: description || null })
      .eq('id', id)

    if (updateError) return { error: updateError.message }

    await refresh()
    return { error: null }
  }

  async function deleteWallet(id: string) {
    const { error: deleteError } = await supabase.from('wallets').delete().eq('id', id)
    if (deleteError) return { error: deleteError.message }

    if (currentWalletId === id) {
      localStorage.removeItem(ACTIVE_WALLET_KEY)
      setCurrentWalletIdState(null)
    }
    await refresh()
    return { error: null }
  }

  const currentWallet = useMemo(
    () => wallets.find((w) => w.id === currentWalletId) ?? null,
    [wallets, currentWalletId],
  )

  const value: WalletContextValue = {
    wallets,
    currentWallet,
    loading,
    error,
    setCurrentWalletId,
    refresh,
    createWallet,
    renameWallet,
    deleteWallet,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}