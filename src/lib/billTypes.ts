
import {
  Home,
  Zap,
  Droplet,
  Wifi,
  Smartphone,
  Tv,
  Shield,
  Car,
  Landmark,
  Receipt,
  type LucideIcon,
} from 'lucide-react'

export type BillTypeGroup =
  | 'housing'
  | 'utilities'
  | 'subscriptions'
  | 'transportation'
  | 'financial'
  | 'other'

export interface BillTypePreset {
  id: string
  label: string
  color: string
  icon?: LucideIcon
  logo?: string
  group: BillTypeGroup
}

export const billTypePresets: BillTypePreset[] = [
  // Housing
  {
    id: 'rent',
    label: 'Rent',
    color: '#7C3AED',
    icon: Home,
    group: 'housing',
  },

  // Utilities
  {
    id: 'electricity',
    label: 'Electricity',
    color: '#D9A521',
    icon: Zap,
    group: 'utilities',
  },
  {
    id: 'water',
    label: 'Water',
    color: '#0072CE',
    icon: Droplet,
    group: 'utilities',
  },
  {
    id: 'internet',
    label: 'Internet',
    color: '#00B48D',
    icon: Wifi,
    group: 'utilities',
  },
  {
    id: 'phone',
    label: 'Phone',
    color: '#0072CE',
    icon: Smartphone,
    group: 'utilities',
  },

  // Subscriptions
  {
    id: 'spotify',
    label: 'Spotify',
    color: '#1DB954',
    logo: '/bill-logos/spotify.svg',
    group: 'subscriptions',
  },
  {
    id: 'netflix',
    label: 'Netflix',
    color: '#E50914',
    logo: '/bill-logos/netflix.svg',
    group: 'subscriptions',
  },
  {
    id: 'disney-plus',
    label: 'Disney+',
    color: '#113CCF',
    logo: '/bill-logos/disney.svg',
    group: 'subscriptions',
  },
  {
    id: 'youtube-premium',
    label: 'YouTube Premium',
    color: '#FF0000',
    logo: '/bill-logos/youtube.svg',
    group: 'subscriptions',
  },
  {
    id: 'subscription',
    label: 'Subscription',
    color: '#7C3AED',
    icon: Tv,
    group: 'subscriptions',
  },

  // Transportation
  {
    id: 'transportation',
    label: 'Transportation',
    color: '#1F6D52',
    icon: Car,
    group: 'transportation',
  },

  // Financial
  {
    id: 'loan',
    label: 'Loan',
    color: '#00287A',
    icon: Landmark,
    group: 'financial',
  },
  {
    id: 'insurance',
    label: 'Insurance',
    color: '#A63B3B',
    icon: Shield,
    group: 'financial',
  },

  // Other
  {
    id: 'other',
    label: 'Other',
    color: '#6B7268',
    icon: Receipt,
    group: 'other',
  },
]

export function getBillTypePreset(billType: string): BillTypePreset {
  return (
    billTypePresets.find((preset) => preset.id === billType) ??
    billTypePresets[billTypePresets.length - 1]
  )
}
