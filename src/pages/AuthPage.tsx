import type { ReactNode } from 'react'

export function AuthPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="ledger-lines relative hidden w-1/2 flex-col justify-between overflow-hidden bg-paper px-12 py-10 lg:flex">
        <span className="font-display text-2xl italic text-ink">Ledger</span>
        <div className="max-w-sm">
          <p className="font-display text-4xl leading-tight text-ink">
            Every peso,
            <br />
            one page.
          </p>
          <p className="mt-4 text-sm text-ink-muted">
            Track personal spending and shared expenses with the people you split life with — in the same simple
            ledger.
          </p>
        </div>
        <span className="text-xs text-ink-muted">Personal &amp; shared budgeting</span>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <span className="font-display text-xl italic text-ink lg:hidden">Ledger</span>
          <h1 className="mt-6 font-display text-2xl text-ink lg:mt-0">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}