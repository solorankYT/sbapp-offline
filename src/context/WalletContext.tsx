import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { saveCache, loadCache } from '@/lib/offlineCache'
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
  renameWallet: (
    id: string,
    name: string,
    description?: string,
  ) => Promise<{ error: string | null }>
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

  /*
   * Restore the active wallet from the available wallet list.
   *
   * Priority:
   * 1. Existing React state
   * 2. localStorage
   * 3. First available wallet
   */
  const restoreActiveWallet = useCallback(
    (walletList: WalletWithRole[]) => {
      setCurrentWalletIdState((prev) => {
        const stored = prev ?? localStorage.getItem(ACTIVE_WALLET_KEY)

        const stillExists =
          stored !== null &&
          walletList.some((wallet) => wallet.id === stored)

        if (stillExists) {
          localStorage.setItem(ACTIVE_WALLET_KEY, stored)
          return stored
        }

        const next = walletList[0]?.id ?? null

        if (next) {
          localStorage.setItem(ACTIVE_WALLET_KEY, next)
        } else {
          localStorage.removeItem(ACTIVE_WALLET_KEY)
        }

        return next
      })
    },
    [],
  )

  const refresh = useCallback(async () => {
    if (!user) {
      setWallets([])
      setCurrentWalletIdState(null)
      setLoading(false)
      return
    }

    setError(null)

    const cacheKey = `wallets:${user.id}`

    /*
     * =========================================================
     * 1. CACHE FIRST
     * =========================================================
     *
     * Load cached wallets before making the Supabase request.
     */
    const cached = loadCache<WalletWithRole[]>(cacheKey)

    if (cached) {
      setWallets(cached)

      // Restore the active wallet immediately from cached data.
      restoreActiveWallet(cached)

      // Cached data is enough for the UI to render.
      setLoading(false)
    }

    /*
     * =========================================================
     * 2. FETCH FRESH DATA
     * =========================================================
     *
     * This happens after the cache has already been applied.
     */
    const { data, error: fetchError } = await supabase
      .from('wallets')
      .select('*, wallet_members(user_id, role)')
      .order('created_at', { ascending: true })

    /*
     * =========================================================
     * 3. SUPABASE FAILED
     * =========================================================
     */
    if (fetchError) {
      if (cached) {
        // Cached wallets are already displayed.
        // Do not replace them or show a blocking error.
        setError(null)
        setLoading(false)
        return
      }

      // No cache exists, so there is nothing to display.
      setError(fetchError.message)
      setLoading(false)
      return
    }

    /*
     * =========================================================
     * 4. SUPABASE SUCCESS
     * =========================================================
     */

    const withRole: WalletWithRole[] = (data ?? []).map((w) => {
      const members = w.wallet_members as {
        user_id: string
        role: 'owner' | 'member'
      }[]

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

    // Replace cached UI with fresh data.
    setWallets(withRole)

    // Save the fresh result for the next offline session.
    saveCache(cacheKey, withRole)

    // Make sure the selected wallet still exists.
    restoreActiveWallet(withRole)

    setError(null)
    setLoading(false)
  }, [user, restoreActiveWallet])

  useEffect(() => {
    setLoading(true)
    refresh()
  }, [refresh])

  async function createWallet(name: string, description?: string) {
    if (!user) return { error: 'Not signed in' }

    const { data, error: insertError } = await supabase
      .from('wallets')
      .insert({
        name,
        description: description || null,
        owner_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      return { error: insertError.message }
    }

    await refresh()

    if (data) {
      setCurrentWalletId(data.id)
    }

    return { error: null }
  }

  async function renameWallet(
    id: string,
    name: string,
    description?: string,
  ) {
    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        name,
        description: description || null,
      })
      .eq('id', id)

    if (updateError) {
      return { error: updateError.message }
    }

    await refresh()

    return { error: null }
  }

  async function deleteWallet(id: string) {
    const { error: deleteError } = await supabase
      .from('wallets')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return { error: deleteError.message }
    }

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

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}