import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, PiggyBank, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/Modal'
import { GoalForm } from '@/features/goals/GoalForm'
import { AddMoneyForm } from '@/features/goals/AddMoneyForm'
import { useWallet } from '@/hooks/useWallet'
import { useGoals } from '@/hooks/useGoals'
import { formatCurrency } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import type { Goal } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAccounts } from '@/hooks/useAccounts';

export function GoalList() {
  const { user } = useAuth()
  const { currentWallet, loading: walletLoading, wallets } = useWallet()
  const { goals, loading, createGoal, addMoney, deleteGoal } = useGoals(currentWallet?.id)
  const { accounts } = useAccounts(currentWallet?.id)

  const [creating, setCreating] = useState(false)
  const [addingTo, setAddingTo] = useState<Goal | null>(null)

  if (walletLoading) return null

  if (!currentWallet) {
    return (
      <div>
        <h1 className="font-display text-2xl text-ink">Goals</h1>
        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-muted">
            {wallets.length === 0 ? 'Create a wallet first to start a savings goal.' : 'Select a wallet to see its goals.'}
          </p>
          {wallets.length === 0 ? (
            <Link to="/wallets" className="mt-3 inline-block text-sm font-medium text-pine hover:underline">
              Create a wallet
            </Link>
          ) : null}
        </div>
      </div>
    )
  }

  async function handleDelete(goal: Goal) {
    if (window.confirm(`Delete "${goal.name}"? This can't be undone.`)) {
      await deleteGoal(goal.id)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Goals</h1>
          <p className="mt-1 text-sm text-ink-muted">{currentWallet.name}</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} strokeWidth={2} />
          New goal
        </Button>
      </div>

    {loading ? (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="mt-4 h-3 w-full rounded" />
              <Skeleton className="mt-1.5 h-3 w-full rounded" />
              <Skeleton className="mt-1.5 h-3 w-2/3 rounded" />
              <Skeleton className="mt-3 h-2 w-full rounded-full" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-7 w-24 rounded-[var(--radius-card)]" />
                <Skeleton className="h-7 w-16 rounded-[var(--radius-card)]" />
              </div>
            </li>
          ))}
        </ul>
      ) : goals.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-muted">No goals yet. Set something you're saving toward.</p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const percent = g.target_amount > 0 ? (g.saved_amount / g.target_amount) * 100 : 0
            const reached = g.saved_amount >= g.target_amount
            const remaining = Math.max(g.target_amount - g.saved_amount, 0)

            return (
              <li key={g.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-medium text-ink">{g.name}</p>
                  {reached ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-pine-soft px-2 py-0.5 text-xs font-medium text-pine">
                      <Check size={12} strokeWidth={2.5} />
                      Reached
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-ink-muted">Target</span>
                  <span className="font-tabular text-ink">{formatCurrency(g.target_amount)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-ink-muted">Saved</span>
                  <span className="font-tabular text-ink">{formatCurrency(g.saved_amount)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm font-medium">
                  <span className="text-ink">Remaining</span>
                  <span className="font-tabular text-ink">{formatCurrency(remaining)}</span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
                  <div className="h-full rounded-full bg-pine" style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" onClick={() => setAddingTo(g)} className="text-xs">
                    <PiggyBank size={14} strokeWidth={2} />
                    Add money
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(g)} className="text-xs text-brick hover:bg-brick-soft">
                    <Trash2 size={14} strokeWidth={2} />
                    Delete
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {creating ? (
        <Modal title="New goal" onClose={() => setCreating(false)}>
          <GoalForm onSubmit={createGoal} onDone={() => setCreating(false)} />
        </Modal>
      ) : null}

            {addingTo ? (
        <Modal title={`Add money to "${addingTo.name}"`} onClose={() => setAddingTo(null)}>
          <AddMoneyForm
            accounts={accounts}
            onSubmit={(amount, accountId) =>
              user ? addMoney(addingTo.id, amount, user.id, accountId) : Promise.resolve({ error: 'Not signed in' })
            }
            onDone={() => setAddingTo(null)}
          />
        </Modal>
      ) : null}
    </div>
  )
}