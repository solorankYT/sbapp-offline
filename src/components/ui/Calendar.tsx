
import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

type CalendarProps = {
  value?: string
  onChange?: (date: string) => void
  minDate?: string
  maxDate?: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function parseISODate(value?: string) {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

function formatISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isBeforeDay(a: Date, b: Date) {
  const first = new Date(
    a.getFullYear(),
    a.getMonth(),
    a.getDate(),
  )

  const second = new Date(
    b.getFullYear(),
    b.getMonth(),
    b.getDate(),
  )

  return first < second
}

function isAfterDay(a: Date, b: Date) {
  const first = new Date(
    a.getFullYear(),
    a.getMonth(),
    a.getDate(),
  )

  const second = new Date(
    b.getFullYear(),
    b.getMonth(),
    b.getDate(),
  )

  return first > second
}

function getToday() {
  const now = new Date()

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  )
}

export function Calendar({
  value,
  onChange,
  minDate,
  maxDate,
}: CalendarProps) {
  const selectedDate = parseISODate(value)
  const min = parseISODate(minDate)
  const max = parseISODate(maxDate)

  const initialDate = selectedDate ?? getToday()

  const [viewDate, setViewDate] = useState(
    new Date(
      initialDate.getFullYear(),
      initialDate.getMonth(),
      1,
    ),
  )

  const days = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const firstWeekday = firstDay.getDay()

    const daysInMonth = new Date(
      year,
      month + 1,
      0,
    ).getDate()

    const previousMonthDays = new Date(
      year,
      month,
      0,
    ).getDate()

    const totalCells = Math.ceil(
      (firstWeekday + daysInMonth) / 7,
    ) * 7

    return Array.from({ length: totalCells }, (_, index) => {
      const dayOffset = index - firstWeekday

      if (dayOffset < 0) {
        const day = previousMonthDays + dayOffset

        return {
          date: new Date(year, month - 1, day),
          currentMonth: false,
        }
      }

      if (dayOffset >= daysInMonth) {
        const day = dayOffset - daysInMonth + 1

        return {
          date: new Date(year, month + 1, day),
          currentMonth: false,
        }
      }

      return {
        date: new Date(year, month, dayOffset + 1),
        currentMonth: true,
      }
    })
  }, [viewDate])

  function goToPreviousMonth() {
    setViewDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1,
        ),
    )
  }

  function goToNextMonth() {
    setViewDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1,
        ),
    )
  }

  function goToToday() {
    const today = getToday()

    setViewDate(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    )

    onChange?.(formatISODate(today))
  }

  function handleDateSelect(date: Date) {
    if (min && isBeforeDay(date, min)) return
    if (max && isAfterDay(date, max)) return

    onChange?.(formatISODate(date))
  }

  function isDisabled(date: Date) {
    if (min && isBeforeDay(date, min)) return true
    if (max && isAfterDay(date, max)) return true

    return false
  }

  const today = getToday()

  return (
    <div className="w-full">
      {/* Calendar header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold text-ink">
            {MONTHS[viewDate.getMonth()]}{' '}
            {viewDate.getFullYear()}
          </p>
        </div>

        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="flex h-8 items-center justify-center text-[11px] font-medium uppercase tracking-wide text-ink-muted"
          >
            {weekday.slice(0, 1)}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map(({ date, currentMonth }) => {
          const selected =
            selectedDate &&
            isSameDay(date, selectedDate)

          const isToday = isSameDay(date, today)
          const disabled = isDisabled(date)

          return (
            <button
              key={formatISODate(date)}
              type="button"
              disabled={disabled}
              onClick={() => handleDateSelect(date)}
              aria-label={date.toLocaleDateString(
                undefined,
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )}
              aria-current={
                isToday ? 'date' : undefined
              }
              aria-pressed={Boolean(selected)}
              className={[
                'relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40',
                !currentMonth
                  ? 'text-ink-muted/40'
                  : 'text-ink',
                disabled
                  ? 'cursor-not-allowed opacity-30'
                  : 'hover:bg-paper',
                selected
                  ? 'bg-pine font-semibold text-white hover:bg-pine'
                  : '',
              ].join(' ')}
            >
              {date.getDate()}

              {isToday && !selected ? (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-pine" />
              ) : null}
            </button>
          )
        })}
      </div>

      {/* Today */}
      <div className="mt-4 border-t border-line pt-3">
        <button
          type="button"
          onClick={goToToday}
          className="text-sm font-medium text-pine transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40"
        >
          Today
        </button>
      </div>
    </div>
  )
}
