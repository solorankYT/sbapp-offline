import { formatMonthLabel } from '@/lib/dashboard'

export function MonthPicker({
  months,
  value,
  onChange,
}: {
  months: string[]
  value: string
  onChange: (monthKey: string) => void
}) {
  if (months.length <= 1) return null

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Select month"
      className="rounded-[var(--radius-card)] border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:border-pine"
    >
      {months.map((m) => (
        <option key={m} value={m}>
          {formatMonthLabel(m)}
        </option>
      ))}
    </select>
  )
}