import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Wallet, ArrowLeftRight, CreditCard, Target, Tag, Settings, LogOut, Calendar, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { WalletSwitcher } from '@/features/wallets/WalletSwitcher'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/wallets', label: 'Wallets', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/accounts', label: 'Accounts', icon: CreditCard },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/calendar', label: 'Schedule', icon: Calendar },
  { to: '/bills', label: 'Bills', icon: Zap },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { user, signOut } = useAuth()

  return (
    <aside className="hidden w-60  shrink-0 flex-col justify-between border-r border-line bg-surface px-4 py-6 lg:flex">
      <div>
        <span className="px-2 font-display text-xl italic text-ink">Spending Buddy</span>
        <div className="mt-5">
          <WalletSwitcher />
        </div>
        <nav className="mt-6 flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-[var(--radius-card)] px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-pine-soft text-pine' : 'text-ink-muted hover:bg-paper hover:text-ink'
                }`
              }
            >
              <Icon size={17} strokeWidth={2} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center justify-between rounded-[var(--radius-card)] px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          aria-label="Log out"
          className="text-ink-muted transition-colors hover:text-brick"
        >
          <LogOut size={17} strokeWidth={2} />
        </button>
      </div>
    </aside>
  )
}