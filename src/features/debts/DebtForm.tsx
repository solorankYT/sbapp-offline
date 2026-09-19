import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { AccountBadge } from '@/features/accounts/AccountBadge'
import type { NewDebt, DebtDirection } from '@/hooks/useDebts'
import type { Account } from '@/types'

export function DebtForm({
  accounts,
  onSubmit,
  onDone,
}: {
  accounts: Account[]
  onSubmit: (input: NewDebt) => Promise<{ error: string | null }>
  onDone: () => void
}) {
  const [direction, setDirection] = useState<DebtDirection>('owed_to_me')
  const [personName, setPersonName] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLending = direction === 'owed_to_me'
  const selectedAccount = accounts.find((a) => a.id === accountId)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!personName.trim()) {
      setError('Enter who this debt is with.')
      return
    }
    const parsedAmount = Number(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }

    setIsSubmitting(true)
    const result = await onSubmit({
      personName: personName.trim(),
      direction,
      amount: parsedAmount,
      description,
      dueDate: dueDate || null,
      accountId: accountId || null,
    })
    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDirection('owed_to_me')}
          className={`flex-1 rounded-[var(--radius-card)] border px-3 py-2 text-sm font-medium transition-colors ${
            isLending ? 'border-pine bg-pine-soft text-pine' : 'border-line text-ink-muted'
          }`}
        >
          Owed to me
        </button>
        <button
          type="button"
          onClick={() => setDirection('i_owe')}
          className={`flex-1 rounded-[var(--radius-card)] border px-3 py-2 text-sm font-medium transition-colors ${
            !isLending ? 'border-brick bg-brick-soft text-brick' : 'border-line text-ink-muted'
          }`}
        >
          I owe
        </button>
      </div>

      <Field
        label="Person"
        type="text"
        placeholder="e.g. Juan"
        required
        autoFocus
        value={personName}
        onChange={(e) => setPersonName(e.target.value)}
      />

      <Field
        label="Amount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {accounts.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="debt-account" className="text-sm font-medium text-ink">
            {isLending ? 'Paid from account (optional)' : 'Received into account (optional)'}
          </label>
          <div className="flex items-center gap-2">
            {selectedAccount ? <AccountBadge account={selectedAccount} size={24} /> : null}
            <select
              id="debt-account"
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

      <Field
        label="Note (optional)"
        type="text"
        placeholder="e.g. Lunch money"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Field label="Due date (optional)" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

      {error ? (
        <p className="rounded-[var(--radius-card)] bg-brick-soft px-3.5 py-2.5 text-sm text-brick" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Add debt
      </Button>
    </form>
  )
}