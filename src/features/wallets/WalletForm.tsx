import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { useWallet } from '@/hooks/useWallet'
import type { WalletWithRole } from '@/types'

export function WalletForm({ wallet, onDone }: { wallet?: WalletWithRole; onDone: () => void }) {
  const { createWallet, renameWallet } = useWallet()
  const [name, setName] = useState(wallet?.name ?? '')
  const [description, setDescription] = useState(wallet?.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = wallet
      ? await renameWallet(wallet.id, name, description)
      : await createWallet(name, description)

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
        label="Name"
        type="text"
        placeholder="Household"
        required
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Field
        label="Description (optional)"
        type="text"
        placeholder="Shared monthly expenses"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {error ? (
        <p className="rounded-[var(--radius-card)] bg-brick-soft px-3.5 py-2.5 text-sm text-brick" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        {wallet ? 'Save changes' : 'Create wallet'}
      </Button>
    </form>
  )
}