import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { formatCurrency } from '@/lib/format'

export function AdjustBalanceForm({
  accountName,
  currentBalance,
  onSubmit,
  onDone,
}: {
  accountName: string
  currentBalance: number
  onSubmit: (newBalance: number, note: string) => Promise<{ error: string | null }>
  onDone: () => void
}) {
  const [newBalance, setNewBalance] = useState(String(currentBalance))
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const parsed = Number(newBalance)
    if (Number.isNaN(parsed)) {
      setError('Enter a valid amount.')
      return
    }

    setIsSubmitting(true)
    const result = await onSubmit(parsed, note)
    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">
        {accountName}'s current tracked balance is <span className="font-medium text-ink">{formatCurrency(currentBalance)}</span>.
        Enter what it should actually be — the difference gets logged as a correction, not as income or an expense.
      </p>

      <Field
        label="Actual balance"
        type="number"
        inputMode="decimal"
        step="0.01"
        required
        autoFocus
        value={newBalance}
        onChange={(e) => setNewBalance(e.target.value)}
      />

      <Field
        label="Note (optional)"
        type="text"
        placeholder="e.g. Forgot to log a few expenses"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {error ? (
        <p className="rounded-[var(--radius-card)] bg-brick-soft px-3.5 py-2.5 text-sm text-brick" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Save correction
      </Button>
    </form>
  )
}