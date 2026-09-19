
import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

export type SelectPickerOption = {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
}

type SelectPickerProps = {
  label?: string
  value: string
  options: SelectPickerOption[]
  onChange: (value: string) => void
  placeholder?: string
  emptyLabel?: string
  searchPlaceholder?: string
  modalTitle?: string
  noSelectionLabel?: string
  disabled?: boolean
  searchable?: boolean
}

export function SelectPicker({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  emptyLabel = 'No options available',
  searchPlaceholder = 'Search...',
  modalTitle = 'Select',
  noSelectionLabel,
  disabled = false,
  searchable = true,
}: SelectPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedOption = options.find(
    (option) => option.value === value,
  )

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return options

    return options.filter((option) => {
      return (
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
      )
    })
  }, [options, search])

  function handleSelect(nextValue: string) {
    onChange(nextValue)
    setSearch('')
    setOpen(false)
  }

  function handleClose() {
    setSearch('')
    setOpen(false)
  }

  return (
    <>
      <div className="w-full">
        {label ? (
          <label className="mb-1.5 block text-sm font-medium text-ink">
            {label}
          </label>
        ) : null}

        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={[
            'flex min-h-10 w-full items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-3.5 py-2.5 text-left',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40',
            disabled
              ? 'cursor-not-allowed opacity-50'
              : 'hover:border-pine/30 hover:bg-surface-hover',
          ].join(' ')}
        >
          {selectedOption?.icon ? (
            <div className="shrink-0">
              {selectedOption.icon}
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <p
              className={[
                'truncate text-sm',
                selectedOption
                  ? 'font-medium text-ink'
                  : 'text-ink-muted',
              ].join(' ')}
            >
              {selectedOption?.label ?? placeholder}
            </p>

            {selectedOption?.description ? (
              <p className="truncate text-xs text-ink-muted">
                {selectedOption.description}
              </p>
            ) : null}
          </div>

          <ChevronDown
            size={17}
            className="shrink-0 text-ink-muted"
          />
        </button>
      </div>

      {open ? (
        <Modal
          title={modalTitle}
          onClose={handleClose}
        >
          <div className="space-y-4">
            {searchable && options.length > 5 ? (
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
                  placeholder={searchPlaceholder}
                  autoFocus
                  aria-label={searchPlaceholder}
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
              {noSelectionLabel ? (
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={[
                    'flex w-full items-center gap-3 rounded-xl border p-3 text-left',
                    'transition-colors',
                    value === ''
                      ? 'border-pine/40 bg-pine-soft'
                      : 'border-line bg-surface hover:border-pine/30 hover:bg-surface-hover',
                  ].join(' ')}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">
                      {noSelectionLabel}
                    </p>

                    <p className="text-xs text-ink-muted">
                      Leave this field empty
                    </p>
                  </div>

                  {value === '' ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : (
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-ink-muted"
                    />
                  )}
                </button>
              ) : null}

              {filteredOptions.map((option) => {
                const selected = option.value === value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={[
                      'flex w-full items-center gap-3 rounded-xl border p-3 text-left',
                      'transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40',
                      selected
                        ? 'border-pine/40 bg-pine-soft'
                        : 'border-line bg-surface hover:border-pine/30 hover:bg-surface-hover',
                    ].join(' ')}
                  >
                    {option.icon ? (
                      <div className="shrink-0">
                        {option.icon}
                      </div>
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {option.label}
                      </p>

                      {option.description ? (
                        <p className="truncate text-xs text-ink-muted">
                          {option.description}
                        </p>
                      ) : null}
                    </div>

                    {selected ? (
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine text-white"
                        aria-label="Selected"
                      >
                        <Check size={12} strokeWidth={3} />
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

              {filteredOptions.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm font-medium text-ink">
                    {emptyLabel}
                  </p>

                  <p className="mt-1 text-xs text-ink-muted">
                    Try a different search.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
