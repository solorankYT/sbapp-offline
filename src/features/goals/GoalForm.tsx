import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'

export function GoalForm({
  onSubmit,
  onDone,
}: {
  onSubmit: (name: string, targetAmount: number) => Promise<{ error: string | null }>
  onDone: () => void
}) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const parsed = Number(targetAmount)
    if (!parsed || parsed <= 0) {
      setError('Enter a target amount greater than 0.')
      return
    }

    setIsSubmitting(true)
    const result = await onSubmit(name, parsed)
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
        label="Goal name"
        type="text"
        placeholder="New laptop"
        required
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Field
        label="Target amount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        required
        value={targetAmount}
        onChange={(e) => setTargetAmount(e.target.value)}
      />
      {error ? (
        <p className="rounded-[var(--radius-card)] bg-brick-soft px-3.5 py-2.5 text-sm text-brick" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Create goal
      </Button>
    </form>
  )
}