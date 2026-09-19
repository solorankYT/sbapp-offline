export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          created_at?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wallets_owner_id_fkey'
            columns: ['owner_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      wallet_members: {
        Row: {
          id: string
          wallet_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wallet_members_wallet_id_fkey'
            columns: ['wallet_id']
            referencedRelation: 'wallets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'wallet_members_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
            accounts: {
        Row: {
          id: string
          wallet_id: string
          name: string
          provider: string
          color: string | null
          icon_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          name: string
          provider?: string
          color?: string | null
          icon_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          name?: string
          provider?: string
          color?: string | null
          icon_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'accounts_wallet_id_fkey'
            columns: ['wallet_id']
            referencedRelation: 'wallets'
            referencedColumns: ['id']
          },
        ]
      }
           categories: {
        Row: {
          id: string
          wallet_id: string
          name: string
          type: 'income' | 'expense'
          budget_limit: number | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          name: string
          type: 'income' | 'expense'
          budget_limit?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          name?: string
          type?: 'income' | 'expense'
          budget_limit?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'categories_wallet_id_fkey'
            columns: ['wallet_id']
            referencedRelation: 'wallets'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          id: string
          bill_id: string | null
          wallet_id: string
          debt_id: string | null
          goal_id: string | null
          user_id: string
          category_id: string | null
          account_id: string | null
          to_account_id: string | null
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description: string | null
          date: string
          is_recurring: boolean
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string 
          bill_id?: string | null 
          goal_id?: string | null
          debt_id?: string | null 
          user_id: string
          category_id?: string | null
          account_id?: string | null
          to_account_id?: string | null
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description?: string | null
          date?: string
          is_recurring?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          bill_id?: string | null 
          goal_id?: string | null 
          debt_id?: string | null    
          user_id?: string
          category_id?: string | null
          account_id?: string | null
          to_account_id?: string | null
          type?: 'income' | 'expense' | 'transfer'
          amount?: number
          description?: string | null
          date?: string
          is_recurring?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_goal_id_fkey'
            columns: ['goal_id']
            referencedRelation: 'goals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_wallet_id_fkey'
            columns: ['wallet_id']
            referencedRelation: 'wallets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_account_id_fkey'
            columns: ['account_id']
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_to_account_id_fkey'
            columns: ['to_account_id']
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
                    {
            foreignKeyName: 'transactions_debt_id_fkey'
            columns: ['debt_id']
            referencedRelation: 'debts'
            referencedColumns: ['id']
          },
                    {
            foreignKeyName: 'transactions_bill_id_fkey'
            columns: ['bill_id']
            referencedRelation: 'bills'
            referencedColumns: ['id']
          },
        ]
      }
     

      goals: {
        Row: {
          id: string
          wallet_id: string
          name: string
          target_amount: number
          saved_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          name: string
          target_amount: number
          saved_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          name?: string
          target_amount?: number
          saved_amount?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'goals_wallet_id_fkey'
            columns: ['wallet_id']
            referencedRelation: 'wallets'
            referencedColumns: ['id']
          },
        ]
      }

       debts: {
        Row: {
          id: string
          wallet_id: string
          person_name: string
          direction: 'owed_to_me' | 'i_owe'
          amount: number
          paid_amount: number
          description: string | null
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          person_name: string
          direction: 'owed_to_me' | 'i_owe'
          amount: number
          paid_amount?: number
          description?: string | null
          due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          person_name?: string
          direction?: 'owed_to_me' | 'i_owe'
          amount?: number
          paid_amount?: number
          description?: string | null
          due_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'debts_wallet_id_fkey'
            columns: ['wallet_id']
            referencedRelation: 'wallets'
            referencedColumns: ['id']
          },
        ]
      }
            bills: {
        Row: {
          id: string
          bill_type: string
          wallet_id: string
          name: string
          amount: number
          category_id: string | null
          account_id: string | null
          due_day: number
          created_at: string
        }
        Insert: {
          id?: string
          bill_type?: string 
          wallet_id: string
          name: string
          amount: number
          category_id?: string | null
          account_id?: string | null
          due_day: number
          created_at?: string
        }
        Update: {
          id?: string
          bill_type?: string 
          wallet_id?: string
          name?: string
          amount?: number
          category_id?: string | null
          account_id?: string | null
          due_day?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bills_wallet_id_fkey'
            columns: ['wallet_id']
            referencedRelation: 'wallets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bills_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bills_account_id_fkey'
            columns: ['account_id']
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      invite_wallet_member: {
        Args: { target_wallet_id: string; member_email: string }
        Returns: undefined
      }
      is_wallet_member: {
        Args: { target_wallet_id: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
       


}