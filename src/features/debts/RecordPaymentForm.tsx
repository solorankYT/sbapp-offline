import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { AccountBadge } from '@/features/accounts/AccountBadge'
import type { Debt, Account } from '@/types'

export function RecordPaymentForm({
  debt,
  accounts,
  onSubmit,
  onDone,
}: {
  debt: Debt
  accounts: Account[]
  onSubmit: (amount: number, accountId: string | null) => Promise<{ error: string | null }>
  onDone: () => void
}) {
  const isReceiving = debt.direction === 'owed_to_me'
  const remaining = debt.amount - debt.paid_amount

  const [amount, setAmount] = useState(remaining > 0 ? String(remaining) : '')
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedAccount = accounts.find((a) => a.id === accountId)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const parsed = Number(amount)
    if (!parsed || parsed <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }

    setIsSubmitting(true)
    const result = await onSubmit(parsed, accountId || null)
    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        onChange={(e) => setAmount(e.target.value)}
      />

      {accounts.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-account" className="text-sm font-medium text-ink">
            {isReceiving ? 'Received into account (optional)' : 'Paid from account (optional)'}
          </label>
          <div className="flex items-center gap-2">
            {selectedAccount ? <AccountBadge account={selectedAccount} size={24} /> : null}
            <select
              id="payment-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="min-w-0 flex-1 rounded-[var(--radius-card)] border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus-visible:border-pine"
            >
              <option value="">Not tracked from an account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-card)] bg-brick-soft px-3.5 py-2.5 text-sm text-brick" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Record payment
      </Button>
    </form>
  )
}