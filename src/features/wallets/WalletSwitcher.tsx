import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronsUpDown, Check, Plus } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'

export function WalletSwitcher() {
  const { wallets, currentWallet, setCurrentWalletId, loading } = useWallet()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (loading) {
    return <div className="h-[42px] animate-pulse rounded-[var(--radius-card)] bg-line/60" />
  }

  if (!currentWallet) {
    return (
      <Link
        to="/wallets"
        className="flex items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-line px-3 py-2.5 text-sm text-ink-muted hover:border-pine hover:text-pine"
      >
        <Plus size={16} strokeWidth={2} />
        Create a wallet
      </Link>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-card)] border border-line bg-surface px-3 py-2.5 text-left"
      >
        <span className="truncate text-sm font-medium text-ink">{currentWallet.name}</span>
        <ChevronsUpDown size={15} strokeWidth={2} className="shrink-0 text-ink-muted" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 rounded-[var(--radius-card)] border border-line bg-surface p-1.5 shadow-lg">
          {wallets.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                setCurrentWalletId(w.id)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between gap-2 rounded-[calc(var(--radius-card)-3px)] px-2.5 py-2 text-left text-sm text-ink hover:bg-paper"
            >
              <span className="truncate">{w.name}</span>
              {w.id === currentWallet.id ? <Check size={14} strokeWidth={2.5} className="shrink-0 text-pine" /> : null}
            </button>
          ))}
          <Link
            to="/wallets"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-[calc(var(--radius-card)-3px)] px-2.5 py-2 text-sm text-pine hover:bg-pine-soft"
          >
            <Plus size={14} strokeWidth={2} />
            Manage wallets
          </Link>
        </div>
      ) : null}
    </div>
  )
}