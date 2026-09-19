
import { useState } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { Calendar } from '@/components/ui/Calendar'
import { Modal } from '@/components/ui/Modal'

type DatePickerProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  minDate?: string
  maxDate?: string
  placeholder?: string
  disabled?: boolean
}

function parseISODate(value?: string) {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

function formatDate(value: string) {
  const date = parseISODate(value)

  if (!date) return ''

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date',
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  function handleChange(nextValue: string) {
    onChange(nextValue)
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
            'flex h-10 w-full items-center gap-2.5 rounded-lg border border-line bg-surface px-3 text-left',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40',
            disabled
              ? 'cursor-not-allowed opacity-50'
              : 'hover:border-pine/30 hover:bg-surface-hover',
          ].join(' ')}
        >
          <CalendarDays
            size={17}
            strokeWidth={1.8}
            className="shrink-0 text-ink-muted"
          />

          <span
            className={[
              'flex-1 truncate text-sm',
              value ? 'text-ink' : 'text-ink-muted',
            ].join(' ')}
          >
            {value ? formatDate(value) : placeholder}
          </span>

          <ChevronDown
            size={16}
            className="shrink-0 text-ink-muted"
          />
        </button>
      </div>

      {open ? (
        <Modal
          title="Select date"
          onClose={() => setOpen(false)}
        >
          <Calendar
            value={value}
            onChange={handleChange}
            minDate={minDate}
            maxDate={maxDate}
          />
        </Modal>
      ) : null}
    </>
  )
}
