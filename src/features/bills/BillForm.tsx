
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { AccountBadge } from '@/features/accounts/AccountBadge'
import {
  billTypePresets,
  getBillTypePreset,
  type BillTypeGroup,
} from '@/lib/billTypes'
import type { NewBill } from '@/hooks/useBills'
import type { Account, Bill, Category } from '@/types'

const groupLabels: Record<BillTypeGroup, string> = {
  housing: 'Housing',
  utilities: 'Utilities',
  subscriptions: 'Subscriptions',
  transportation: 'Transportation',
  financial: 'Financial',
  other: 'Other',
}

const groupOrder: BillTypeGroup[] = [
   'subscriptions',
   'utilities',
  'housing',
  
  'transportation',
  'financial',
  'other',
]

export function BillForm({
  bill,
  categories,
  accounts,
  onSubmit,
  onDone,
}: {
  bill?: Bill
  categories: Category[]
  accounts: Account[]
  onSubmit: (input: NewBill) => Promise<{ error: string | null }>
  onDone: () => void
}) {
  const [name, setName] = useState(bill?.name ?? '')
  const [billType, setBillType] = useState(bill?.bill_type ?? 'other')
  const [amount, setAmount] = useState(bill ? String(bill.amount) : '')
  const [dueDay, setDueDay] = useState(bill ? String(bill.due_day) : '')
  const [categoryId, setCategoryId] = useState(bill?.category_id ?? '')
  const [accountId, setAccountId] = useState(bill?.account_id ?? '')

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isOptionsOpen, setIsOptionsOpen] = useState(
    Boolean(bill?.category_id || bill?.account_id),
  )

  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false)
  const [typeSearch, setTypeSearch] = useState('')

  const nameWasEdited = useRef(Boolean(bill?.name))

  const expenseCategories = categories.filter(
    (category) => category.type === 'expense',
  )

  const selectedAccount = accounts.find(
    (account) => account.id === accountId,
  )

  const selectedPreset = getBillTypePreset(billType)


  function handleBillTypeChange(typeId: string) {
    setBillType(typeId)

    const preset = getBillTypePreset(typeId)

    if (!nameWasEdited.current) {
      setName(preset.label)
    }

    setIsTypePickerOpen(false)
    setTypeSearch('')
  }

  function handleNameChange(value: string) {
    nameWasEdited.current = true
    setName(value)
  }

  /*
   * Filter types using both the bill name and its group.
   *
   * Example:
   * Searching "subscription" will show Spotify,
   * Netflix, Disney+, etc.
   */
  const filteredGroups = useMemo(() => {
    const query = typeSearch.trim().toLowerCase()

    return groupOrder
      .map((group) => {
        const types = billTypePresets.filter((preset) => {
          if (preset.group !== group) return false

          if (!query) return true

          return (
            preset.label.toLowerCase().includes(query) ||
            preset.id.toLowerCase().includes(query) ||
            groupLabels[preset.group].toLowerCase().includes(query)
          )
        })

        return {
          group,
          types,
        }
      })
      .filter((group) => group.types.length > 0)
  }, [typeSearch])

  useEffect(() => {
    if (!isTypePickerOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isTypePickerOpen])

  useEffect(() => {
    if (!isTypePickerOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsTypePickerOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isTypePickerOpen])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Give this bill a name.')
      return
    }

    const parsedAmount = Number(amount)

    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }

    const parsedDueDay = Number(dueDay)

    if (!parsedDueDay || parsedDueDay < 1 || parsedDueDay > 31) {
      setError('Enter a due day between 1 and 31.')
      return
    }

    setIsSubmitting(true)

    const result = await onSubmit({
      name: name.trim(),
      amount: parsedAmount,
      categoryId: categoryId || null,
      accountId: accountId || null,
      dueDay: parsedDueDay,
      billType,
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    onDone()
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <form
        onSubmit={handleSubmit}
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 sm:px-6"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-5">
          {/* Bill name */}
          <Field
            label="Bill name"
            type="text"
            placeholder="e.g. Electricity"
            required
            autoFocus
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
          />

          {/* Amount + Due day */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Expected amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />

            <Field
              label="Due day"
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              placeholder="e.g. 15"
              required
              value={dueDay}
              onChange={(event) => setDueDay(event.target.value)}
            />
          </div>

          {/* Bill type */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink">Type</p>

            <button
              type="button"
              onClick={() => setIsTypePickerOpen(true)}
              className="flex min-h-[56px] w-full items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-3.5 text-left transition-colors hover:bg-paper"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${selectedPreset.color}18`,
                }}
              >
                {selectedPreset.logo ? (
                  <img
                    src={selectedPreset.logo}
                    alt=""
                    className="h-5 w-5 object-contain"
                  />
                ) : selectedPreset.icon ? (
                  <selectedPreset.icon
                    size={18}
                    strokeWidth={2}
                    style={{ color: selectedPreset.color }}
                  />
                ) : null}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {selectedPreset.label}
                </span>

                <span className="block text-xs">
                  {groupLabels[selectedPreset.group]}
                </span>
              </span>

              <ChevronDown
                size={18}
                className="shrink-0"
              />
            </button>
          </div>

          {/* Optional settings */}
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            <button
              type="button"
              onClick={() =>
                setIsOptionsOpen((open) => !open)
              }
              className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left transition-colors hover:bg-paper"
              aria-expanded={isOptionsOpen}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">
                  Optional settings
                </span>

                {!isOptionsOpen && (categoryId || accountId) ? (
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {[
                      categoryId ? 'Category' : null,
                      accountId ? 'Default account' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                ) : null}
              </span>

              <ChevronDown
                size={18}
                className={`shrink-0 text-muted transition-transform duration-200 ${
                  isOptionsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isOptionsOpen ? (
              <div className="border-t border-line px-4 pb-4 pt-4">
                <div className="flex flex-col gap-4">
                  {/* Category */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="bill-category"
                      className="text-sm font-medium text-ink"
                    >
                      Category
                    </label>

                    <select
                      id="bill-category"
                      value={categoryId}
                      onChange={(event) =>
                        setCategoryId(event.target.value)
                      }
                      className="min-h-[48px] rounded-[var(--radius-card)] border border-line bg-background px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-pine"
                    >
                      <option value="">No category</option>

                      {expenseCategories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Default account */}
                  {accounts.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="bill-account"
                        className="text-sm font-medium text-ink"
                      >
                        Default account
                      </label>

                      <div className="flex items-center gap-2">
                        {selectedAccount ? (
                          <AccountBadge
                            account={selectedAccount}
                            size={24}
                          />
                        ) : null}

                        <select
                          id="bill-account"
                          value={accountId}
                          onChange={(event) =>
                            setAccountId(event.target.value)
                          }
                          className="min-h-[48px] min-w-0 flex-1 rounded-[var(--radius-card)] border border-line bg-background px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-pine"
                        >
                          <option value="">
                            No default account
                          </option>

                          {accounts.map((account) => (
                            <option
                              key={account.id}
                              value={account.id}
                            >
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* Error */}
          {error ? (
            <p
              className="rounded-[var(--radius-card)] bg-brick-soft px-3.5 py-2.5 text-sm text-brick"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      </form>

      {/* Sticky submit */}
      <div className="absolute inset-x-0 bottom-0 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full"
            onClick={() => {
              const form = document.querySelector(
                'form',
              ) as HTMLFormElement | null

              form?.requestSubmit()
            }}
          >
            {bill ? 'Save changes' : 'Add bill'}
          </Button>
        </div>
      </div>

      {/* Bill type picker */}
      {isTypePickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close bill type picker"
            onClick={() => setIsTypePickerOpen(false)}
            className="absolute inset-0 bg-black/30"
          />

          {/* Picker */}
          <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-xl sm:max-w-lg sm:rounded-3xl">
            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-ink">
                  Choose bill type
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Select a service or bill category
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsTypePickerOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper hover:text-ink"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* Search */}
            <div className="shrink-0 px-4 pb-3 pt-3">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />

                <input
                  type="search"
                  value={typeSearch}
                  onChange={(event) =>
                    setTypeSearch(event.target.value)
                  }
                  placeholder="Search bill type..."
                  autoFocus
                  className="min-h-[46px] w-full rounded-[var(--radius-card)] border border-line bg-background pl-10 pr-3.5 text-sm text-ink outline-none placeholder:text-muted focus:border-pine"
                />
              </div>
            </div>

            {/* Grouped bill types */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
              {filteredGroups.length > 0 ? (
                <div>
                  {filteredGroups.map(
                    ({ group, types }, groupIndex) => (
                      <section
                        key={group}
                        className={
                          groupIndex > 0
                            ? 'border-t border-line pt-5'
                            : ''
                        }
                        style={{
                          marginTop:
                            groupIndex > 0 ? '20px' : undefined,
                        }}
                      >
                        {/* Group title */}
                        <div className="mb-2 px-1">
                          <p className="text-xs font-semibold uppercase tracking-wide">
                            {groupLabels[group]}
                          </p>
                        </div>

                        {/* Types */}
                        <div className="flex flex-col">
                          {types.map((preset) => {
                            const isSelected =
                              billType === preset.id

                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() =>
                                  handleBillTypeChange(
                                    preset.id,
                                  )
                                }
                                className={`flex min-h-[54px] w-full items-center gap-3 rounded-xl px-2.5 text-left transition-colors ${
                                  isSelected
                                    ? 'bg-pine-soft'
                                    : 'hover:bg-paper'
                                }`}
                              >
                                <span
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                  style={{
                                    backgroundColor: `${preset.color}18`,
                                  }}
                                >
                                  {preset.logo ? (
                                    <img
                                      src={preset.logo}
                                      alt=""
                                      className="h-5 w-5 object-contain"
                                    />
                                  ) : preset.icon ? (
                                    <preset.icon
                                      size={18}
                                      strokeWidth={2}
                                      style={{
                                        color:
                                          preset.color,
                                      }}
                                    />
                                  ) : null}
                                </span>

                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                                  {preset.label}
                                </span>

                                {isSelected ? (
                                  <span className="text-xs font-medium text-pine">
                                    Selected
                                  </span>
                                ) : null}
                              </button>
                            )
                          })}
                        </div>
                      </section>
                    ),
                  )}
                </div>
              ) : (
                <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                  <p className="text-sm font-medium text-ink">
                    No bill types found
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Try searching for another service or category.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

