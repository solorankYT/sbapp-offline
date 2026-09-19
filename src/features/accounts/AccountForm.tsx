
import { useState, type FormEvent } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import {
  accountProviderPresets,
  customProviderPreset,
  customColorSwatches,
  type AccountProviderId,
} from '@/lib/accountProviders'
import { AccountBadge } from '@/features/accounts/AccountBadge'
import type { AccountInput } from '@/hooks/useAccounts'
import type { Account } from '@/types'

const allPresets = [...accountProviderPresets, customProviderPreset]

export function AccountForm({
  account,
  onSubmit,
  onDone,
}: {
  account?: Account
  onSubmit: (input: AccountInput) => Promise<{ error: string | null }>
  onDone: () => void
}) {
  const [provider, setProvider] = useState<AccountProviderId>(
    (account?.provider as AccountProviderId) ?? 'gcash',
  )
  const [name, setName] = useState(account?.name ?? '')
  const [color, setColor] = useState(
    account?.color ?? customColorSwatches[0],
  )
  const [iconUrl, setIconUrl] = useState(account?.icon_url ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAppearance, setShowAppearance] = useState(
    Boolean(account?.color || account?.icon_url),
  )

  const isCustom = provider === 'custom'

  const selectedPreset = allPresets.find((preset) => preset.id === provider)

  function handleProviderPick(id: AccountProviderId) {
    setProvider(id)

    if (id !== 'custom' && !account) {
      const preset = allPresets.find((p) => p.id === id)

      if (preset) {
        setName(preset.label)
      }
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Give this account a name.')
      return
    }

    setIsSubmitting(true)

    const result = await onSubmit({
      name: trimmedName,
      provider,
      color: isCustom ? color : null,
      iconUrl: iconUrl.trim() || null,
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Provider */}
      <section>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-ink">
            Choose provider
          </h3>
          <p className="mt-0.5 text-xs text-ink-muted">
            Select the service this account belongs to.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {allPresets.map((preset) => {
            const isSelected = provider === preset.id

            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleProviderPick(preset.id)}
                className={[
                  'relative flex min-h-20 flex-col items-center justify-center gap-1.5',
                  'rounded-[var(--radius-card)] border px-2 py-3',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40',
                  isSelected
                    ? 'border-pine bg-pine-soft'
                    : 'border-line hover:border-pine/30 hover:bg-surface-hover',
                ].join(' ')}
              >
                <AccountBadge
                  account={{
                    name: preset.label,
                    provider: preset.id,
                    color: null,
                    icon_url: null,
                  }}
                  size={28}
                />

                <span className="text-xs font-medium text-ink">
                  {preset.label}
                </span>

                {isSelected ? (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-pine text-white">
                    <Check size={10} strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-ink">
            Account details
          </h3>
        </div>

        <Field
          label="Account name"
          type="text"
          placeholder={isCustom ? 'e.g. UnionBank' : undefined}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus={!account}
        />

        {!isCustom && (
          <p className="mt-2 text-xs text-ink-muted">
            You can rename this account if you use multiple accounts from the
            same provider.
          </p>
        )}
      </section>

      {/* Preview */}
      <section className="rounded-[var(--radius-card)] border border-line bg-paper/50 p-3.5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Preview
        </p>

        <div className="flex items-center gap-3">
          <AccountBadge
            account={{
              name: name || selectedPreset?.label || 'Account',
              provider,
              color: isCustom ? color : null,
              icon_url: iconUrl.trim() || null,
            }}
            size={40}
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {name || 'Account name'}
            </p>

            <p className="text-xs text-ink-muted">
              {selectedPreset?.label ?? 'Custom account'}
            </p>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section>
        <button
          type="button"
          onClick={() => setShowAppearance((value) => !value)}
          aria-expanded={showAppearance}
          className="flex w-full items-center justify-between py-1 text-left"
        >
          <div>
            <p className="text-sm font-semibold text-ink">
              Customize appearance
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Optional color and icon customization.
            </p>
          </div>

          {showAppearance ? (
            <ChevronUp size={17} className="text-ink-muted" />
          ) : (
            <ChevronDown size={17} className="text-ink-muted" />
          )}
        </button>

        {showAppearance ? (
          <div className="mt-4 space-y-4 pl-1">
            {isCustom ? (
              <div>
                <p className="mb-2 text-sm font-medium text-ink">
                  Account color
                </p>

                <div className="flex flex-wrap gap-2">
                  {customColorSwatches.map((swatch) => {
                    const isSelected = color === swatch

                    return (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => setColor(swatch)}
                        aria-label={`Select color ${swatch}`}
                        aria-pressed={isSelected}
                        className={[
                          'flex h-9 w-9 items-center justify-center rounded-full',
                          'ring-offset-2 transition-transform',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40',
                          isSelected ? 'ring-2 ring-pine' : '',
                        ].join(' ')}
                        style={{ backgroundColor: swatch }}
                      >
                        {isSelected ? (
                          <Check
                            size={15}
                            strokeWidth={2.5}
                            className="text-white"
                          />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <Field
                label="Custom icon URL"
                type="url"
                placeholder="https://…"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
              />

              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                Optional. Leave blank to use the default provider icon.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {/* Error */}
      {error ? (
        <p
          className="rounded-[var(--radius-card)] bg-brick-soft px-3.5 py-2.5 text-sm text-brick"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {/* Primary action */}
      <Button
        type="submit"
        isLoading={isSubmitting}
        className="w-full"
      >
        {account ? 'Save changes' : 'Add account'}
      </Button>
    </form>
  )
}

