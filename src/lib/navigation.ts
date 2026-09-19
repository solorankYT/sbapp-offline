import { CalendarCheck, CreditCard, Tag, Target, Wallet, HandCoins, type LucideIcon } from 'lucide-react'

export interface HubLink {
  to: string
  label: string
  description: string
  icon: LucideIcon
}

// Pages that don't need one-tap bottom-nav access but should still be easy
// to reach on mobile. Shown as a grid on the Dashboard (mobile only — desktop
// already lists everything in the sidebar). Wallets/Home/Transactions/Budgets
// live in the bottom nav instead — see MobileNav.tsx. To add a new page later
// (e.g. Subscriptions), just add an entry here.
export const hubLinks: HubLink[] = [
  { to: '/categories', label: 'Categories', description: 'Edit income & expense tags', icon: Tag },
  { to: '/goals', label: 'Goals', description: 'Track savings targets', icon: Target },
  {to: '/wallets', label: 'Wallets', description: 'Manage your wallets', icon: Wallet },
  {to: '/accounts', label: 'Accounts', description: 'Manage your accounts', icon: CreditCard },
  {to: '/subscriptions', label: 'Subscriptions', description: 'Track recurring payments', icon: CalendarCheck },
  {to: '/debts', label: 'Debts', description: 'Track loans & credit cards', icon: HandCoins },
  {to: '/calendar', label: 'Schedule', description: 'View upcoming transactions', icon: CalendarCheck },
  {to: '/bills', label: 'Bills', description: 'Track upcoming bills', icon: HandCoins },  
]