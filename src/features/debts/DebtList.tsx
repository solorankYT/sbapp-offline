import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, HandCoins, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/Modal'
import { DebtForm } from '@/features/debts/DebtForm'
import { EditDebtForm } from '@/features/debts/EditDebtForm'
import { RecordPaymentForm } from '@/features/debts/RecordPaymentForm'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import { useDebts } from '@/hooks/useDebts'
import { useAccounts } from '@/hooks/useAccounts'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Debt } from '@/types'

type FilterValue = 'all' | 'owed_to_me' | 'i_owe'

export function DebtList() {
  const { user } = useAuth()
  const { currentWallet, loading: walletLoading, wallets } = useWallet()
  const {
    debts,
    loading,
    createDebt,
    recordPayment,
    updateDebt,
    deleteDebt,
  } = useDebts(currentWallet?.id)
  const { accounts } = useAccounts(currentWallet?.id)

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)
  const [payingOn, setPayingOn] = useState<Debt | null>(null)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [showSettled, setShowSettled] = useState(false)

  // Swipe state
  const [swipedDebt, setSwipedDebt] = useState<string | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchCurrentX = useRef<number | null>(null)

  const { totalOwedToMe, totalIOwe } = useMemo(() => {
    let owedToMe = 0
    let iOwe = 0

    for (const d of debts) {
      const remaining = Math.max(d.amount - d.paid_amount, 0)

      if (remaining <= 0) continue

      if (d.direction === 'owed_to_me') {
        owedToMe += remaining
      } else {
        iOwe += remaining
      }
    }

    return { totalOwedToMe: owedToMe, totalIOwe: iOwe }
  }, [debts])

  const visibleDebts = useMemo(() => {
    return debts.filter((d) => {
      const isSettled = d.amount - d.paid_amount <= 0

      if (!showSettled && isSettled) return false
      if (filter !== 'all' && d.direction !== filter) return false

      return true
    })
  }, [debts, filter, showSettled])

  if (walletLoading) return null

  if (!currentWallet) {
    return (
      <div>
        <h1 className="font-display text-2xl text-ink">Debts</h1>

        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-muted">
            {wallets.length === 0
              ? 'Create a wallet first to track debts.'
              : 'Select a wallet to see its debts.'}
          </p>

          {wallets.length === 0 ? (
            <Link
              to="/wallets"
              className="mt-3 inline-block text-sm font-medium text-pine hover:underline"
            >
              Create a wallet
            </Link>
          ) : null}
        </div>
      </div>
    )
  }

  async function handleDelete(debt: Debt) {
    if (
      window.confirm(
        `Delete this debt with ${debt.person_name}? This can't be undone.`,
      )
    ) {
      setSwipedDebt(null)
      await deleteDebt(debt.id)
    }
  }

  function handleTouchStart(
    e: React.TouchEvent,
    debtId: string,
  ) {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX

    // Close another open swipe
    if (swipedDebt && swipedDebt !== debtId) {
      setSwipedDebt(null)
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return

    touchCurrentX.current = e.touches[0].clientX
  }

  function handleTouchEnd(debtId: string) {
    if (
      touchStartX.current === null ||
      touchCurrentX.current === null
    ) {
      return
    }

    const distance =
      touchCurrentX.current - touchStartX.current

    // Swipe left
    if (distance < -60) {
      setSwipedDebt(debtId)
    }

    // Swipe right to close
    if (distance > 40) {
      setSwipedDebt(null)
    }

    touchStartX.current = null
    touchCurrentX.current = null
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Debts</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {currentWallet.name}
          </p>
        </div>

        <Button onClick={() => setCreating(true)}>
          <Plus size={16} strokeWidth={2} />
          Add debt
        </Button>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Owed to you
          </p>
          <p className="mt-1.5 font-tabular font-display text-xl text-pine">
            {formatCurrency(totalOwedToMe)}
          </p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            You owe
          </p>
          <p className="mt-1.5 font-tabular font-display text-xl text-brick">
            {formatCurrency(totalIOwe)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 rounded-[var(--radius-card)] border border-line bg-surface p-1">
          {(
            [
              ['all', 'All'],
              ['owed_to_me', 'Owed to me'],
              ['i_owe', 'I owe'],
            ] as [FilterValue, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-[calc(var(--radius-card)-3px)] px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-pine-soft text-pine'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowSettled((v) => !v)}
          className={`rounded-[var(--radius-card)] border px-3 py-2 text-sm font-medium transition-colors ${
            showSettled
              ? 'border-pine bg-pine-soft text-pine'
              : 'border-line bg-surface text-ink-muted hover:text-ink'
          }`}
        >
          Show settled
        </button>
      </div>

      {/* List */}
      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-ink-muted">
            Loading debts…
          </p>
        ) : visibleDebts.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line px-6 py-10 text-center">
            <p className="text-sm text-ink-muted">
              {debts.length === 0
                ? "No debts yet — you're all settled."
                : 'Nothing matches this filter.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {visibleDebts.map((d) => {
              const remaining = Math.max(
                d.amount - d.paid_amount,
                0,
              )

              const percent =
                d.amount > 0
                  ? (d.paid_amount / d.amount) * 100
                  : 0

              const isSettled = remaining <= 0

              const isOverdue =
                !isSettled &&
                d.due_date != null &&
                d.due_date <
                  new Date().toISOString().slice(0, 10)

              const isLending =
                d.direction === 'owed_to_me'

              const isSwiped = swipedDebt === d.id

              return (
                <li
                  key={d.id}
                  className="relative overflow-hidden rounded-[var(--radius-card)]"
                  onTouchStart={(e) =>
                    handleTouchStart(e, d.id)
                  }
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(d.id)}
                >
                  {/* Delete action behind the row */}
                  <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-brick">
                    <button
                      type="button"
                      aria-label={`Delete debt with ${d.person_name}`}
                      onClick={() => handleDelete(d)}
                      className="flex h-full w-full items-center justify-center text-white"
                    >
                      <Trash2
                        size={18}
                        strokeWidth={2}
                      />
                    </button>
                  </div>

                  {/* Debt content */}
                  <div
                    className={`relative border border-line bg-surface p-4 transition-transform duration-200 ease-out ${
                      isSwiped
                        ? '-translate-x-20'
                        : 'translate-x-0'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isLending
                            ? 'bg-pine-soft text-pine'
                            : 'bg-brick-soft text-brick'
                        }`}
                      >
                        {isLending ? (
                          <HandCoins
                            size={16}
                            strokeWidth={2}
                          />
                        ) : (
                          <Landmark
                            size={16}
                            strokeWidth={2}
                          />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-ink">
                            {d.person_name}
                          </p>

                          <div className="flex shrink-0 items-center gap-1">
                            <span className="font-tabular text-sm font-medium text-ink">
                              {formatCurrency(remaining)}
                            </span>

                            {/* Edit icon */}
                            <button
                              type="button"
                              aria-label={`Edit debt with ${d.person_name}`}
                              onClick={() => {
                                setEditing(d)
                                setSwipedDebt(null)
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper hover:text-ink focus:outline-none focus:ring-2 focus:ring-pine/30"
                            >
                              <Pencil
                                size={14}
                                strokeWidth={2}
                              />
                            </button>
                          </div>
                        </div>

                        {d.description ? (
                          <p className="mt-0.5 truncate text-xs text-ink-muted">
                            {d.description}
                          </p>
                        ) : null}

                        <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                    

                          {d.due_date ? (
                            <span
                              className={
                                isOverdue
                                  ? 'font-medium text-brick'
                                  : ''
                              }
                            >
                              · {isOverdue
                                ? 'Overdue'
                                : 'Due'}{' '}
                              {formatDate(d.due_date)}
                            </span>
                          ) : null}

                          {isSettled ? (
                            <span className="font-medium text-pine">
                              · Settled
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper">
                          <div
                            className={`h-full rounded-full ${
                              isLending
                                ? 'bg-pine'
                                : 'bg-brick'
                            }`}
                            style={{
                              width: `${Math.min(
                                percent,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Record payment */}
                    {!isSettled ? (
                      <div className="mt-3 pl-12">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setPayingOn(d)
                            setSwipedDebt(null)
                          }}
                          className="w-full text-xs"
                        >
                          Record payment
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {creating ? (
        <Modal
          title="Add debt"
          onClose={() => setCreating(false)}
        >
          <DebtForm
            accounts={accounts}
            onSubmit={(input) =>
              user
                ? createDebt(input, user.id)
                : Promise.resolve({
                    error: 'Not signed in',
                  })
            }
            onDone={() => setCreating(false)}
          />
        </Modal>
      ) : null}

      {editing ? (
        <Modal
          title="Edit debt"
          onClose={() => setEditing(null)}
        >
          <EditDebtForm
            debt={editing}
            onSubmit={(input) =>
              updateDebt(editing.id, input)
            }
            onDone={() => setEditing(null)}
          />
        </Modal>
      ) : null}

      {payingOn ? (
        <Modal
          title={`Record payment · ${payingOn.person_name}`}
          onClose={() => setPayingOn(null)}
        >
          <RecordPaymentForm
            debt={payingOn}
            accounts={accounts}
            onSubmit={(amount, accountId) =>
              user
                ? recordPayment(
                    payingOn.id,
                    amount,
                    accountId,
                    user.id,
                  )
                : Promise.resolve({
                    error: 'Not signed in',
                  })
            }
            onDone={() => setPayingOn(null)}
          />
        </Modal>
      ) : null}
    </div>
  )
}
