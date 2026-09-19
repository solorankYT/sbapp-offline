import { Link } from 'react-router-dom'
import { hubLinks } from '@/lib/navigation'

export function DashboardMoreHub() {
  const gridColsClass = hubLinks.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'

  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface lg:hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Quick Actions</h2>
        </div>

        <span className="text-xs font-medium text-muted">
          {hubLinks.length} actions
        </span>
      </div>

      {/* Actions */}
    <ul className={`grid ${gridColsClass}`}>
        {hubLinks.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="
                group
                flex h-[92px] w-full flex-col items-center justify-center
                gap-2
                px-2
                transition-colors
                hover:bg-paper
                active:bg-paper
                active:scale-[0.98]
              "
            >
              <span
                className="
                  flex h-9 w-9 shrink-0 items-center justify-center
                  rounded-lg
                  bg-pine-soft
                  text-pine
                  transition-transform
                  group-hover:scale-105
                "
              >
                <Icon size={17} strokeWidth={2} />
              </span>

              <span className="max-w-full text-center text-xs font-medium leading-tight text-ink">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}