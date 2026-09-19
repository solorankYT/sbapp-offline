import { WifiOff, RefreshCw } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner({ pendingCount, onSync }: { pendingCount: number; onSync: () => void }) {
  const isOnline = useOnlineStatus()

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[var(--radius-card)] border px-3.5 py-2.5 text-sm ${
        isOnline ? 'border-pine bg-pine-soft text-pine' : 'border-gold bg-brick-soft text-brick'
      }`}
    >
      <span className="flex items-center gap-2">
        {isOnline ? <RefreshCw size={14} strokeWidth={2} /> : <WifiOff size={14} strokeWidth={2} />}
        {isOnline
          ? `${pendingCount} transaction${pendingCount === 1 ? '' : 's'} waiting to sync`
          : "You're offline — new transactions will save locally and sync automatically."}
      </span>
      {isOnline && pendingCount > 0 ? (
        <button type="button" onClick={onSync} className="font-medium underline">
          Sync now
        </button>
      ) : null}
    </div>
  )
}