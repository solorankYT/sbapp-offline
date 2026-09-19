import { Monitor, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import type { ThemePreference } from '@/context/ThemeContext'

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="inline-flex gap-1.5 rounded-[var(--radius-card)] border border-line bg-surface p-1">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          className={`flex items-center gap-1.5 rounded-[calc(var(--radius-card)-3px)] px-3 py-1.5 text-sm font-medium transition-colors ${
            theme === value ? 'bg-pine-soft text-pine' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Icon size={14} strokeWidth={2} />
          {label}
        </button>
      ))}
    </div>
  )
}