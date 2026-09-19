import { getProviderPreset } from '@/lib/accountProviders'
import type { Account } from '@/types'

export function AccountBadge({
  account,
  size = 28,
}: {
  account: Pick<Account, 'name' | 'provider' | 'color' | 'icon_url'>
  size?: number
}) {
  const preset = getProviderPreset(account.provider)
  const color = account.color ?? preset.color
  const Icon = preset.icon

  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size, backgroundColor: account.icon_url ? undefined : `${color}22` }}
    >
      {account.icon_url ? (
        <img src={account.icon_url} alt={account.name} className="h-full w-full object-cover" />
      ) : (
        <Icon size={Math.round(size * 0.55)} strokeWidth={2} style={{ color }} />
      )}
    </span>
  )
}