import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import type { Debt } from '@/types'

export function EditDebtForm({
  debt,
  onSubmit,
  onDone,
}: {
  debt: Debt
  onSubmit: (input: { personName: string; description: string; dueDate: string | null }) => Promise<{ error: string | null }>
  onDone: () => void
}) {
  const [personName, setPersonName] = useState(debt.person_name)
  const [description, setDescription] = useState(debt.description ?? '')
  const [dueDate, setDueDate] = useState(debt.due_date ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!personName.trim()) {
      setError('Enter who this debt is with.')
      return
    }

    setIsSubmitting(true)
    const result = await onSubmit({ personName: personName.trim(), description, dueDate: dueDate || null })
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
        label="Person"
        type="text"
        required
        autoFocus
        value={personName}
        onChange={(e) => setPersonName(e.target.value)}
      />
      <Field
        label="Note (optional)"
        type="text"
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
        Save changes
      </Button>
    </form>
  )
}