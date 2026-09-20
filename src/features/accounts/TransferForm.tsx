import { useState, type FormEvent } from 'react'
import {
  ArrowDown,
  ArrowUpDown,
  ChevronRight,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Modal } from '@/components/ui/Modal'
import { AccountBadge } from '@/features/accounts/AccountBadge'
import { todayISO } from '@/lib/format'
import { getProviderPreset } from '@/lib/accountProviders'
import type { NewTransfer } from '@/hooks/useTransactions'
import type { Account } from '@/types'
import { DatePicker } from '@/components/ui/DatePicker'

export function TransferForm({
    accounts,
    balances,
    defaultFromId,
    initial,
    submitLabel,
    onSubmit,
    onDone,
  }: {
    accounts: Account[]
    balances: Record<string, number>
    defaultFromId?: string
    initial?: NewTransfer
    submitLabel?: string
    onSubmit: (input: NewTransfer) => Promise<{ error: string | null }>
    onDone: () => void
  }) {
  const [fromAccountId, setFromAccountId] = useState(
    initial?.fromAccountId ??
      defaultFromId ??
      accounts[0]?.id ??
      '',
  )

  const [toAccountId, setToAccountId] = useState(
    initial?.toAccountId ??
      accounts.find((a) => a.id !== defaultFromId)?.id ??
      '',
  )

  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : '',
  )

  const [description, setDescription] = useState(
    initial?.description ?? '',
  )

  const [date, setDate] = useState(
    initial?.date ?? todayISO(),
  )

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selecting, setSelecting] = useState<'from' | 'to' | null>(
    null,
  )

  const fromAccount = accounts.find(
    (account) => account.id === fromAccountId,
  )

  const toAccount = accounts.find(
    (account) => account.id === toAccountId,
  )

  /*
   * Current balance of the selected source account.
   */
  const currentFromBalance = balances[fromAccountId] ?? 0

  /*
   * When editing an existing transfer, the original transfer
   * is already included in the current balance.
   *
   * Example:
   *
   * Original transfer: ₱150
   * Current balance:   ₱50
   *
   * Available when editing = ₱50 + ₱150 = ₱200
   *
   * For a new transfer, available balance is simply the
   * current balance.
   */
  const availableFromBalance = initial
    ? currentFromBalance +
      (initial.fromAccountId === fromAccountId
        ? initial.amount
        : 0)
    : currentFromBalance

  function formatBalance(value: number) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  function swapAccounts() {
    if (!fromAccountId || !toAccountId) return

    setFromAccountId(toAccountId)
    setToAccountId(fromAccountId)
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const parsedAmount = Number(amount)

    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }

    if (!fromAccountId || !toAccountId) {
      setError('Choose both accounts.')
      return
    }

    if (fromAccountId === toAccountId) {
      setError('Choose two different accounts.')
      return
    }

    if (parsedAmount > availableFromBalance) {
      setError(
        `Insufficient balance. ${
          fromAccount?.name ?? 'This account'
        } has ${formatBalance(availableFromBalance)} available.`,
      )
      return
    }

    setIsSubmitting(true)

    const result = await onSubmit({
      fromAccountId,
      toAccountId,
      amount: parsedAmount,
      description: description.trim(),
      date,
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    onDone()
  }

  function selectAccount(accountId: string) {
    if (selecting === 'from') {
      setFromAccountId(accountId)

      if (accountId === toAccountId) {
        setToAccountId('')
      }
    }

    if (selecting === 'to') {
      setToAccountId(accountId)

      if (accountId === fromAccountId) {
        setFromAccountId('')
      }
    }

    setError(null)
    setSelecting(null)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transfer route */}
        <section>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-ink">
              Transfer between
            </h3>

            <p className="mt-0.5 text-xs text-ink-muted">
              Choose where the money is coming from and going to.
            </p>
          </div>

          <div className="relative">
            <AccountSelector
              label="From"
              account={fromAccount}
              balance={currentFromBalance}
              onClick={() => setSelecting('from')}
            />

            <div className="relative z-10 flex justify-center py-1.5">
              <button
                type="button"
                onClick={swapAccounts}
                disabled={!fromAccount || !toAccount}
                aria-label="Swap accounts"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink-muted transition hover:border-pine/30 hover:text-pine disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40"
              >
                <ArrowUpDown size={15} strokeWidth={2} />
              </button>
            </div>

            <AccountSelector
              label="To"
              account={toAccount}
              onClick={() => setSelecting('to')}
            />
          </div>
        </section>

        {/* Amount */}
        <section>
          <Field
            label="Amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
            autoFocus
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError(null)
            }}
          />

          {fromAccount ? (
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-ink-muted">
                Available balance
              </span>

              <span
                className={
                  availableFromBalance < 0
                    ? 'font-medium text-brick'
                    : 'font-medium text-ink'
                }
              >
                {formatBalance(availableFromBalance)}
              </span>
            </div>
          ) : null}
        </section>

        {/* Optional details */}
        <section className="space-y-4">
          <Field
            label="Note"
            type="text"
            placeholder="e.g. Cash in for the week"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <DatePicker
            label="Date"
            value={date}
            onChange={setDate}
          />
        </section>

        {/* Error */}
        {error ? (
          <p
            className="rounded-[var(--radius-card)] bg-brick-soft px-3.5 py-2.5 text-sm text-brick"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {/* Summary */}
        {fromAccount && toAccount && amount ? (
          <TransferSummary
            from={fromAccount}
            to={toAccount}
            amount={amount}
            date={date}
          />
        ) : null}

        {/* Primary action */}
     <Button
        type="submit"
        isLoading={isSubmitting}
        className="w-full"
      >
        {submitLabel ?? (initial ? 'Save changes' : 'Transfer')}
      </Button>
      </form>

      {/* Account picker */}
      {selecting ? (
        <AccountPicker
          accounts={accounts}
          balances={balances}
          selecting={selecting}
          selectedId={
            selecting === 'from'
              ? fromAccountId
              : toAccountId
          }
          excludedId={
            selecting === 'from'
              ? toAccountId
              : fromAccountId
          }
          onSelect={selectAccount}
          onClose={() => setSelecting(null)}
        />
      ) : null}
    </>
  )
}

function AccountSelector({
  label,
  account,
  balance,
  onClick,
}: {
  label: string
  account?: Account
  balance?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition hover:border-pine/30 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40"
    >
      {account ? (
        <>
          <AccountBadge account={account} size={40} />

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              {label}
            </p>

            <p className="mt-0.5 truncate text-sm font-semibold text-ink">
              {account.name}
            </p>

            {label === 'From' && balance !== undefined ? (
              <p className="mt-0.5 text-xs text-ink-muted">
                {balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                available
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            {label}
          </p>

          <p className="mt-0.5 text-sm text-ink-muted">
            Select account
          </p>
        </div>
      )}

      <ChevronRight
        size={17}
        className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5"
      />
    </button>
  )
}

function TransferSummary({
  from,
  to,
  amount,
  date,
}: {
  from: Account
  to: Account
  amount: string
  date: string
}) {
  const formattedAmount = Number(amount).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-paper/50 px-4 py-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex items-center gap-2">
          <AccountBadge account={from} size={28} />

          <span className="truncate text-xs font-medium text-ink">
            {from.name}
          </span>

          <ArrowDown
            size={13}
            className="shrink-0 text-ink-muted"
          />

          <AccountBadge account={to} size={28} />

          <span className="truncate text-xs font-medium text-ink">
            {to.name}
          </span>
        </div>

        <p className="shrink-0 font-tabular text-sm font-semibold text-ink">
          {formattedAmount}
        </p>
      </div>

      <p className="mt-2 text-xs text-ink-muted">
        Transfer on {date}
      </p>
    </div>
  )
}

function AccountPicker({
  accounts,
  balances,
  selecting,
  selectedId,
  excludedId,
  onSelect,
  onClose,
}: {
  accounts: Account[]
  balances: Record<string, number>
  selecting: 'from' | 'to'
  selectedId: string
  excludedId: string
  onSelect: (accountId: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')

  const filteredAccounts = accounts
    .filter((account) => account.id !== excludedId)
    .filter((account) => {
      const query = search.trim().toLowerCase()

      if (!query) return true

      const provider = getProviderPreset(
        account.provider,
      )

      return (
        account.name.toLowerCase().includes(query) ||
        provider.label.toLowerCase().includes(query)
      )
    })

  return (
    <Modal
      title={
        selecting === 'from'
          ? 'Transfer from'
          : 'Transfer to'
      }
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          {selecting === 'from'
            ? 'Choose the account the money will come from.'
            : 'Choose the account receiving the money.'}
        </p>

        {accounts.length > 5 ? (
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search accounts..."
              aria-label="Search accounts"
              className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-9 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-pine focus:ring-2 focus:ring-pine/10"
            />

            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-1.5">
          {filteredAccounts.map((account) => {
            const preset = getProviderPreset(
              account.provider,
            )

            const selected =
              account.id === selectedId

            const balance =
              balances[account.id] ?? 0

            return (
              <button
                key={account.id}
                type="button"
                onClick={() => onSelect(account.id)}
                className={[
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left',
                  'transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40',
                  selected
                    ? 'border-pine/40 bg-pine-soft'
                    : 'border-line bg-surface hover:border-pine/30 hover:bg-surface-hover',
                ].join(' ')}
              >
                <AccountBadge account={account} size={38} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {account.name}
                  </p>

                  <p className="text-xs text-ink-muted">
                    {preset.label}
                  </p>

                  {selecting === 'from' ? (
                    <p className="mt-0.5 text-xs font-medium text-ink">
                      {balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      available
                    </p>
                  ) : null}
                </div>

                {selected ? (
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine text-white"
                    aria-label="Selected"
                  >
                    ✓
                  </span>
                ) : (
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-ink-muted"
                  />
                )}
              </button>
            )
          })}

          {filteredAccounts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-ink">
                No accounts found
              </p>

              <p className="mt-1 text-xs text-ink-muted">
                Try a different search.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}