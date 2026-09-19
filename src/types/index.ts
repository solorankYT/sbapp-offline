import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Wallet = Database['public']['Tables']['wallets']['Row']
export type WalletMember = Database['public']['Tables']['wallet_members']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Account = Database['public']['Tables']['accounts']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Debt = Database['public']['Tables']['debts']['Row']
export type Bill = Database['public']['Tables']['bills']['Row']

export interface TransactionWithRelations extends Transaction {
  category: Pick<Category, 'id' | 'name' | 'type'> | null
  account: Pick<Account, 'id' | 'name' | 'provider' | 'color' | 'icon_url'> | null
  toAccount: Pick<Account, 'id' | 'name' | 'provider' | 'color' | 'icon_url'> | null
  goal: Pick<Goal, 'id' | 'name'> | null
  profile: Pick<Profile, 'id' | 'full_name' | 'email'> | null
}
export interface WalletMemberWithProfile extends WalletMember {
  profile: Pick<Profile, 'id' | 'full_name' | 'email'> | null
}

export interface WalletWithRole extends Wallet {
  role: WalletMember['role']
  memberCount: number
}

export interface TransactionWithRelations extends Transaction {
  category: Pick<Category, 'id' | 'name' | 'type'> | null
  profile: Pick<Profile, 'id' | 'full_name' | 'email'> | null
  debt: Pick<Debt, 'id' | 'person_name' | 'amount'> | null
}

