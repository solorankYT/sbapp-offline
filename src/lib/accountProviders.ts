import { Smartphone, Landmark, Banknote, Wallet, type LucideIcon } from 'lucide-react'

export type AccountProviderId = 'gcash' | 'maya' | 'bpi' | 'bdo' | 'cash' | 'custom'

export interface AccountProviderPreset {
  id: AccountProviderId
  label: string
  color: string
  icon: LucideIcon
}

export const accountProviderPresets: AccountProviderPreset[] = [
  { id: 'gcash', label: 'GCash', color: '#0072CE', icon: Smartphone },
  { id: 'maya', label: 'Maya', color: '#00B48D', icon: Smartphone },
  { id: 'bpi', label: 'BPI', color: '#C8102E', icon: Landmark },
  { id: 'bdo', label: 'BDO', color: '#00287A', icon: Landmark },
  { id: 'cash', label: 'Cash', color: '#1F6D52', icon: Banknote },
]

export const customProviderPreset: AccountProviderPreset = {
  id: 'custom',
  label: 'Custom',
  color: '#6B7268',
  icon: Wallet,
}

export function getProviderPreset(providerId: string): AccountProviderPreset {
  return accountProviderPresets.find((p) => p.id === providerId) ?? customProviderPreset
}

export const customColorSwatches = [
  '#1F6D52',
  '#A63B3B',
  '#B8873A',
  '#0072CE',
  '#6B7268',
  '#7C3AED',
]