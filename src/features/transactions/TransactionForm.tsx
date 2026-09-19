
import { useState, type FormEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { SelectPicker } from '@/components/ui/SelectPicker'
import { AccountBadge } from '@/features/accounts/AccountBadge'
import { DatePicker } from '@/components/ui/DatePicker'
import { todayISO } from '@/lib/format'
import type { Account, Category } from '@/types'
import type { NewTransaction } from '@/hooks/useTransactions'
import { getProviderPreset } from '@/lib/accountProviders'

interface TransactionFormProps {
  categories: Category[]
  accounts: Account[]
  initial?: Partial<NewTransaction>
  submitLabel?: string
  onSubmit: (input: NewTransaction) => Promise<{ error: string | null }>
  onDone: () => void
}

export function TransactionForm({
  categories,
  accounts,
  initial,
  submitLabel = 'Save',
  onSubmit,
  onDone,
}: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>(
    initial?.type ?? 'expense',
  )

  const [amount, setAmount] = useState(
    initial?.amount ? String(initial.amount) : '',
  )

  const [categoryId, setCategoryId] = useState<string>(
    initial?.categoryId ?? '',
  )

  const [accountId, setAccountId] = useState<string>(
    initial?.accountId ?? '',
  )

  const [description, setDescription] = useState(
    initial?.description ?? '',
  )

  const [date, setDate] = useState(
    initial?.date ?? todayISO(),
  )

  const [isRecurring, setIsRecurring] = useState(
    initial?.isRecurring ?? false,
  )

  const [showMoreOptions, setShowMoreOptions] = useState(
    Boolean(initial?.description || initial?.isRecurring),
  )

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredCategories = categories.filter(
    (category) => category.type === type,
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const parsedAmount = Number(amount)

    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }

    setIsSubmitting(true)

    const result = await onSubmit({
      type,
      amount: parsedAmount,
      categoryId: categoryId || null,
      accountId: accountId || null,
      description: description.trim(),
      date,
      isRecurring,
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setAmount('')
    setDescription('')
    onDone()
  }

  function handleTypeChange(nextType: 'income' | 'expense') {
    setType(nextType)
    setCategoryId('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
    >
      {/* Transaction type */}
      <div className="grid grid-cols-2 rounded-lg bg-paper p-1">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          aria-pressed={type === 'expense'}
          className={[
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40',
            type === 'expense'
              ? 'bg-surface text-brick shadow-sm'
              : 'text-ink-muted hover:text-ink',
          ].join(' ')}
        >
          Expense
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          aria-pressed={type === 'income'}
          className={[
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40',
            type === 'income'
              ? 'bg-surface text-pine shadow-sm'
              : 'text-ink-muted hover:text-ink',
          ].join(' ')}
        >
          Income
        </button>
      </div>

      {/* Amount */}
      <div>
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
      </div>

      {/* Category */}
      <SelectPicker
        label="Category"
        value={categoryId}
        onChange={setCategoryId}
        modalTitle="Select category"
        placeholder="No category"
        noSelectionLabel="No category"
        searchPlaceholder="Search categories..."
        emptyLabel="No categories found"
        options={filteredCategories.map((category) => ({
          value: category.id,
          label: category.name,
        }))}
      />

      {/* Account */}
      {accounts.length > 0 ? (
        <SelectPicker
          label="Account"
          value={accountId}
          onChange={setAccountId}
          modalTitle="Select account"
          placeholder="No account"
          noSelectionLabel="No account"
          searchPlaceholder="Search accounts..."
          emptyLabel="No accounts found"
          options={accounts.map((account) => {
            const provider = getProviderPreset(account.provider)

            return {
              value: account.id,
              label: account.name,
              description: provider.label,
              icon: (
                <AccountBadge
                  account={account}
                  size={34}
                />
              ),
            }
          })}
        />
      ) : null}

      {/* Date */}
      <DatePicker
        label="Date"
        value={date}
        onChange={setDate}
      />

      {/* Optional details */}
      <div className="border-t border-line pt-1">
        <button
          type="button"
          onClick={() =>
            setShowMoreOptions((value) => !value)
          }
          aria-expanded={showMoreOptions}
          className="flex w-full items-center justify-between py-2 text-left"
        >
          <div>
            <p className="text-sm font-medium text-ink">
              More options
            </p>

            {!showMoreOptions ? (
              <p className="mt-0.5 text-xs text-ink-muted">
                Note and recurring transaction
              </p>
            ) : null}
          </div>

          <ChevronDown
            size={17}
            className={[
              'text-ink-muted transition-transform',
              showMoreOptions ? 'rotate-180' : '',
            ].join(' ')}
          />
        </button>

        {showMoreOptions ? (
          <div className="mt-3 space-y-4">
            <Field
              label="Note"
              type="text"
              placeholder="e.g. Lunch"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-lg py-1 text-sm text-ink">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) =>
                  setIsRecurring(e.target.checked)
                }
                className="h-4 w-4 rounded border-line accent-pine"
              />

              <span>
                <span className="block font-medium">
                  Recurring transaction
                </span>

                <span className="mt-0.5 block text-xs text-ink-muted">
                  For rent, subscriptions, salary, etc.
                </span>
              </span>
            </label>
          </div>
        ) : null}
      </div>

      {/* Error */}
      {error ? (
        <p
          className="rounded-lg bg-brick-soft px-3.5 py-2.5 text-sm text-brick"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {/* Submit */}
      <Button
        type="submit"
        isLoading={isSubmitting}
        className="w-full"
      >
        {submitLabel}
      </Button>
    </form>
  )
}

