import { forwardRef, type InputHTMLAttributes } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, id, className = '', ...props },
  ref,
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`rounded-[var(--radius-card)] border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus-visible:border-pine ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-sm text-brick" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})