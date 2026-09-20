import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ArrowRightLeft, MoreHorizontal, Trash2, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/Modal'
import { AccountForm } from '@/features/accounts/AccountForm'
import { AccountBadge } from '@/features/accounts/AccountBadge'
import { TransferForm } from '@/features/accounts/TransferForm'
import { AdjustBalanceForm } from '@/features/accounts/AdjustBalanceForm'
import { TransactionForm } from '@/features/transactions/TransactionForm'
import { useWallet } from '@/hooks/useWallet'
import { useAccounts } from '@/hooks/useAccounts'
import { useAccountBalances } from '@/hooks/useAccountBalances'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/format'
import { getProviderPreset } from '@/lib/accountProviders'
import type { Account } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'

const SWIPE_OPEN_THRESHOLD = 55

type SwipeState = { id: string; direction: 'left' | 'right' } | null

export function AccountList() {
  const { currentWallet, loading: walletLoading, wallets } = useWallet()
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts(currentWallet?.id)
  const { balances, loading: balancesLoading, refresh: refreshBalances } = useAccountBalances(currentWallet?.id)
  const { categories } = useCategories(currentWallet?.id)
  const { addTransaction, addTransfer, adjustBalance } = useTransactions(currentWallet?.id)

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [addingMoneyTo, setAddingMoneyTo] = useState<Account | null>(null)
  const [spendingFrom, setSpendingFrom] = useState<Account | null>(null)
  const [transferring, setTransferring] = useState<{ fromId?: string } | null>(null)
  const [adjusting, setAdjusting] = useState<Account | null>(null)

  const [swipeState, setSwipeState] = useState<SwipeState>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  if (walletLoading) return null

  if (!currentWallet) {
    return (
      <div>
        <h1 className="font-display text-2xl text-ink">Accounts</h1>

        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-muted">
            {wallets.length === 0
              ? 'Create a wallet first to add accounts.'
              : 'Select a wallet to see its accounts.'}
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

  async function handleDelete(account: Account) {
    setSwipeState(null)
    setOpenMenu(null)

    if (
      window.confirm(
        `Remove "${account.name}"? Existing transactions keep their amount but lose this tag.`,
      )
    ) {
      await deleteAccount(account.id)
      await refreshBalances()
    }
  }

  function handleAdjustClick(account: Account) {
    setSwipeState(null)
    setOpenMenu(null)
    setAdjusting(account)
  }

  async function afterMoneyMove() {
    await refreshBalances()
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Accounts</h1>
        </div>

        <div className="flex gap-2">
          {accounts.length >= 2 ? (
            <Button variant="secondary" onClick={() => setTransferring({})}>
              <ArrowRightLeft size={16} strokeWidth={2} />
            </Button>
          ) : null}

          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={2} />
          </Button>
        </div>
      </div>

      {loading ? (
        <ul className="mt-6 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="rounded-[var(--radius-card)] border border-line bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-[34px] w-[34px] shrink-0 rounded-full" />

                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-28 rounded" />
                  <Skeleton className="mt-1.5 h-3 w-16 rounded" />
                </div>

                <Skeleton className="h-5 w-20 shrink-0 rounded" />
              </div>
            </li>
          ))}
        </ul>
      ) : accounts.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-muted">
            No accounts yet — add GCash, Maya, a bank, or cash to start
            tracking balances.
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {accounts.map((a) => {
            const preset = getProviderPreset(a.provider)
            const balance = balances[a.id] ?? 0
            const isSwipedLeft = swipeState?.id === a.id && swipeState.direction === 'left'
            const isSwipedRight = swipeState?.id === a.id && swipeState.direction === 'right'
            const isSwiped = isSwipedLeft || isSwipedRight
            const isMenuOpen = openMenu === a.id

            return (
              <li
                key={a.id}
                className="relative overflow-hidden rounded-[var(--radius-card)]"
              >
                {/* Adjust action revealed by swiping right (panel sits on the left) */}
                <div className="absolute inset-y-0 left-0 flex w-20 items-center justify-center bg-gold">
                  <button
                    type="button"
                    onClick={() => handleAdjustClick(a)}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 text-white"
                    aria-label={`Adjust ${a.name}'s balance`}
                  >
                    <SlidersHorizontal size={16} strokeWidth={2} />
                    <span className="text-[10px] font-medium">Adjust</span>
                  </button>
                </div>

                {/* Delete action revealed by swiping left (panel sits on the right) */}
                <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-brick">
                  <button
                    type="button"
                    onClick={() => handleDelete(a)}
                    className="flex h-full w-full items-center justify-center text-white"
                    aria-label={`Delete ${a.name}`}
                  >
                    <Trash2 size={18} strokeWidth={2} />
                  </button>
                </div>

                {/* Account card */}
                <div
                  onTouchStart={(e) => {
                    const touch = e.touches[0]
                    if (touch) {
                      ;(e.currentTarget as HTMLElement).dataset.touchStartX =
                        String(touch.clientX)
                    }
                  }}
                  onTouchEnd={(e) => {
                    const startX = Number(
                      (e.currentTarget as HTMLElement).dataset.touchStartX,
                    )

                    const touch = e.changedTouches[0]

                    if (!touch || !startX) return

                    // Positive = swiped left (finger moved left), negative = swiped right.
                    const diff = startX - touch.clientX

                    if (diff > SWIPE_OPEN_THRESHOLD) {
                      setSwipeState({ id: a.id, direction: 'left' })
                      setOpenMenu(null)
                    } else if (diff < -SWIPE_OPEN_THRESHOLD) {
                      setSwipeState({ id: a.id, direction: 'right' })
                      setOpenMenu(null)
                    } else {
                      setSwipeState(null)
                    }
                  }}
                  onClick={() => {
                    if (isSwiped) {
                      setSwipeState(null)
                      return
                    }

                    setEditing(a)
                  }}
                  style={{
                    transform: isSwipedLeft
                      ? 'translateX(-80px)'
                      : isSwipedRight
                        ? 'translateX(80px)'
                        : 'translateX(0)',
                  }}
                  className="relative cursor-pointer rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-transform duration-200 hover:border-pine/30 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <AccountBadge account={a} size={34} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {a.name}
                      </p>

                      <p className="text-xs text-ink-muted">
                        {preset.label}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs text-ink-muted">Balance</p>

                        {balancesLoading ? (
                          <Skeleton className="mt-1 h-5 w-20 rounded" />
                        ) : (
                          <p className="font-tabular text-lg font-medium text-ink">
                            {formatCurrency(balance)}
                          </p>
                        )}
                      </div>

                      {/* Desktop menu — swipe doesn't apply here, so both actions live here too */}
                      <div
                        className="relative hidden sm:block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(isMenuOpen ? null : a.id)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-hover hover:text-ink"
                          aria-label={`More options for ${a.name}`}
                        >
                          <MoreHorizontal size={18} strokeWidth={2} />
                        </button>

                        {isMenuOpen ? (
                          <div className="absolute right-0 top-10 z-20 w-36 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => handleAdjustClick(a)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-paper"
                            >
                              <SlidersHorizontal size={15} strokeWidth={2} />
                              Adjust balance
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(a)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brick hover:bg-brick-soft"
                            >
                              <Trash2 size={15} strokeWidth={2} />
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {creating ? (
        <Modal title="Add account" onClose={() => setCreating(false)}>
          <AccountForm
            onSubmit={createAccount}
            onDone={() => setCreating(false)}
          />
        </Modal>
      ) : null}

      {editing ? (
        <Modal title="Edit account" onClose={() => setEditing(null)}>
          <AccountForm
            account={editing}
            onSubmit={(input) => updateAccount(editing.id, input)}
            onDone={() => setEditing(null)}
          />
        </Modal>
      ) : null}

      {addingMoneyTo ? (
        <Modal
          title={`Add money to ${addingMoneyTo.name}`}
          onClose={() => setAddingMoneyTo(null)}
        >
          <TransactionForm
            categories={categories}
            accounts={accounts}
            submitLabel="Add money"
            initial={{
              type: 'income',
              accountId: addingMoneyTo.id,
            }}
            onSubmit={addTransaction}
            onDone={async () => {
              setAddingMoneyTo(null)
              await afterMoneyMove()
            }}
          />
        </Modal>
      ) : null}

      {spendingFrom ? (
        <Modal
          title={`Spend from ${spendingFrom.name}`}
          onClose={() => setSpendingFrom(null)}
        >
          <TransactionForm
            categories={categories}
            accounts={accounts}
            submitLabel="Log expense"
            initial={{
              type: 'expense',
              accountId: spendingFrom.id,
            }}
            onSubmit={addTransaction}
            onDone={async () => {
              setSpendingFrom(null)
              await afterMoneyMove()
            }}
          />
        </Modal>
      ) : null}

      {transferring ? (
        <Modal title="Transfer money" onClose={() => setTransferring(null)}>
          <TransferForm
            accounts={accounts}
            balances={balances}
            defaultFromId={transferring.fromId}
            onSubmit={addTransfer}
            onDone={async () => {
              setTransferring(null)
              await afterMoneyMove()
            }}
          />
        </Modal>
      ) : null}

      {adjusting ? (
        <Modal title={`Adjust ${adjusting.name}'s balance`} onClose={() => setAdjusting(null)}>
          <AdjustBalanceForm
            accountName={adjusting.name}
            currentBalance={balances[adjusting.id] ?? 0}
            onSubmit={(newBalance, note) =>
              adjustBalance(adjusting.id, newBalance - (balances[adjusting.id] ?? 0), note)
            }
            onDone={async () => {
              setAdjusting(null)
              await afterMoneyMove()
            }}
          />
        </Modal>
      ) : null}
    </div>
  )
}