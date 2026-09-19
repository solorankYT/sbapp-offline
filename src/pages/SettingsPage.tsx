import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/features/settings/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { WalletSwitcher } from '@/features/wallets/WalletSwitcher';

export function SettingsPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl text-ink">Settings</h1>



        <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <p className="text-sm text-ink-muted">
        Change your active wallet
      </p>
      <WalletSwitcher />
      </div>

      <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Signed in as</p>
        <p className="mt-1 text-sm text-ink">{user?.email}</p>

          <Button variant="secondary" onClick={() => signOut()} className="mt-6">
        <LogOut size={16} strokeWidth={2} />
        Log out
      </Button>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Appearance</p>
        <div className="mt-2">
          <ThemeToggle />
        </div>
      </div>


    </div>
  )
}