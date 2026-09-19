import { useRef, useState, type FormEvent, type TouchEvent } from 'react'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/hooks/useWallet'
import { useCategories } from '@/hooks/useCategories'
import { useCategorySpending } from '@/hooks/useCategorySpending'
import { formatCurrency } from '@/lib/format'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Category } from '@/types'

// Inline "rename" control shared by both income and expense rows.
function NameEditor({
  category,
  onRename,
}: {
  category: Category
  onRename: (name: string) => Promise<{ error: string | null }>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [saving, setSaving] = useState(false)

  async function save() {
    const trimmed = name.trim()

    if (!trimmed || trimmed === category.name) {
      setName(category.name)
      setEditing(false)
      return
    }

    setSaving(true)
    const result = await onRename(trimmed)
    setSaving(false)

    if (!result.error) {
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void save()
            }

            if (e.key === 'Escape') {
              setEditing(false)
              setName(category.name)
            }
          }}
          className="min-w-0 flex-1 border-none bg-transparent text-sm text-ink focus:outline-none"
        />

        <button
          type="button"
          onClick={save}
          disabled={saving}
          aria-label="Save name"
          className="shrink-0 text-pine"
        >
          <Check size={16} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={() => {
            setEditing(false)
            setName(category.name)
          }}
          aria-label="Cancel"
          className="shrink-0 text-ink-muted"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {/* Tap name on mobile to rename */}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="min-w-0 flex-1 truncate text-left text-sm text-ink md:pointer-events-none"
      >
        {category.name}
      </button>

      {/* Desktop rename button */}
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Rename"
        className="hidden shrink-0 text-ink-muted transition-opacity hover:text-ink md:block md:opacity-0 md:group-hover:opacity-100"
      >
        <Pencil size={14} strokeWidth={2} />
      </button>
    </div>
  )
}

// Inline editable budget limit + progress bar, shown only for expense categories.
function BudgetLimitEditor({
  category,
  spent,
  onSetBudget,
}: {
  category: Category
  spent: number
  onSetBudget: (amount: number | null) => Promise<{ error: string | null }>
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(
    category.budget_limit != null ? String(category.budget_limit) : '',
  )
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)

    const trimmed = value.trim()
    const parsed = trimmed === '' ? null : Number(trimmed)
    const clean =
      parsed !== null && !Number.isNaN(parsed) && parsed > 0 ? parsed : null

    await onSetBudget(clean)

    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="No limit"
          className="w-28 rounded-[calc(var(--radius-card)-3px)] border border-line bg-surface px-2 py-1 text-xs text-ink placeholder:text-ink-muted focus-visible:border-pine"
        />

        <button
          type="button"
          onClick={save}
          disabled={saving}
          aria-label="Save budget"
          className="text-pine"
        >
          <Check size={14} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label="Cancel"
          className="text-ink-muted"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    )
  }

  if (category.budget_limit == null) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1 text-xs font-medium text-pine hover:underline"
      >
        Set budget limit
      </button>
    )
  }

  const percent =
    category.budget_limit > 0
      ? (spent / category.budget_limit) * 100
      : 0

  const isOver = spent > category.budget_limit
  const overBy = spent - category.budget_limit

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-muted">
          {formatCurrency(spent)} of {formatCurrency(category.budget_limit)}
        </span>

        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit budget"
          className="text-ink-muted hover:text-ink"
        >
          <Pencil size={12} strokeWidth={2} />
        </button>
      </div>

      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper">
        <div
          className={`h-full rounded-full ${
            isOver ? 'bg-brick' : 'bg-pine'
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      {isOver ? (
        <p className="mt-1 text-xs font-medium text-brick">
          Over by {formatCurrency(overBy)}
        </p>
      ) : null}
    </div>
  )
}

function AddCategoryForm({
  type,
  onAdd,
}: {
  type: 'income' | 'expense'
  onAdd: (name: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!name.trim()) return

    setSubmitting(true)

    await onAdd(name.trim())

    setSubmitting(false)
    setName('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-pine hover:underline"
      >
        <Plus size={14} strokeWidth={2} />
        Add {type} category
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        className="min-w-0 flex-1 rounded-[var(--radius-card)] border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:border-pine"
      />

      <Button
        type="submit"
        variant="secondary"
        isLoading={submitting}
        className="text-xs"
      >
        Add
      </Button>

      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Cancel"
        className="text-ink-muted"
      >
        <X size={16} strokeWidth={2} />
      </button>
    </form>
  )
}

/**
 * Mobile swipe-to-delete row.
 *
 * Each row owns its own swipe state, so swiping one category
 * will NOT move the other categories.
 */
function SwipeCategoryRow({
  children,
  onDelete,
}: {
  children: React.ReactNode
  onDelete: () => void
}) {
  const [offset, setOffset] = useState(0)
  const [swiped, setSwiped] = useState(false)

  const startX = useRef(0)
  const startY = useRef(0)
  const currentX = useRef(0)
  const dragging = useRef(false)
  const verticalMovement = useRef(false)

  const DELETE_WIDTH = 72

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0]

    startX.current = touch.clientX
    startY.current = touch.clientY
    currentX.current = touch.clientX
    dragging.current = true
    verticalMovement.current = false
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (!dragging.current) return

    const touch = event.touches[0]

    currentX.current = touch.clientX

    const deltaX = touch.clientX - startX.current
    const deltaY = touch.clientY - startY.current

    // If the user is scrolling vertically, don't treat it as a swipe.
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
      verticalMovement.current = true
      return
    }

    if (verticalMovement.current) return

    let newOffset = deltaX

    // Starting from an already-swiped state.
    if (swiped) {
      newOffset = DELETE_WIDTH + deltaX
    }

    // Only allow left movement.
    newOffset = Math.min(0, newOffset)

    // Don't allow dragging beyond the delete action.
    newOffset = Math.max(-DELETE_WIDTH, newOffset)

    setOffset(newOffset)
  }

  function handleTouchEnd() {
    if (!dragging.current) return

    dragging.current = false

    if (verticalMovement.current) {
      setOffset(swiped ? -DELETE_WIDTH : 0)
      return
    }

    const totalDelta = currentX.current - startX.current

    if (totalDelta < -30) {
      setOffset(-DELETE_WIDTH)
      setSwiped(true)
    } else if (totalDelta > 30) {
      setOffset(0)
      setSwiped(false)
    } else {
      setOffset(swiped ? -DELETE_WIDTH : 0)
    }
  }

  function closeSwipe() {
    setOffset(0)
    setSwiped(false)
  }

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)]">
      {/* Delete action behind the row */}
      <div className="absolute inset-y-0 right-0 flex w-[72px] items-center justify-center bg-brick">
        <button
          type="button"
          onClick={() => {
            closeSwipe()
            onDelete()
          }}
          aria-label="Delete category"
          className="flex h-full w-full items-center justify-center text-white"
        >
          <Trash2 size={17} strokeWidth={2} />
        </button>
      </div>

      {/* Actual row */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging.current ? 'none' : 'transform 180ms ease-out',
        }}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  )
}

export function CategoryManager() {
  const { currentWallet, loading: walletLoading } = useWallet()

  const {
    categories,
    loading,
    addCategory,
    renameCategory,
    deleteCategory,
    setCategoryBudget,
  } = useCategories(currentWallet?.id)

  const { spendingByCategory } = useCategorySpending(currentWallet?.id)

  if (walletLoading || loading) {
    return (
      <div>
        <Skeleton className="h-7 w-32 rounded" />
        <Skeleton className="mt-2 h-3.5 w-24 rounded" />
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          {[0, 1].map((col) => (
            <section key={col}>
              <Skeleton className="h-3.5 w-20 rounded" />
              <div className="mt-3 flex flex-col gap-1.5">
                {[0, 1, 2, 3].map((row) => (
                  <Skeleton key={row} className="h-11 w-full rounded-[var(--radius-card)]" />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    )
  }

  if (!currentWallet) {
    return (
      <p className="text-sm text-ink-muted">
        Create or select a wallet to manage its categories.
      </p>
    )
  }

  const expenseCategories = categories.filter(
    (c) => c.type === 'expense',
  )

  const incomeCategories = categories.filter(
    (c) => c.type === 'income',
  )

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        'Delete this category? Transactions using it will keep their amount but lose the tag.',
      )
    ) {
      return
    }

    await deleteCategory(id)
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Categories</h1>

      <p className="mt-1.5 text-sm text-ink-muted">
        For {currentWallet.name}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* EXPENSE */}
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-ink-muted">
            Expense
          </h2>

          <p className="mt-1 text-xs text-ink-muted">
            Set a monthly budget limit per category — optional.
          </p>

          <ul className="mt-3 flex flex-col gap-1.5">
            {expenseCategories.map((c) => (
              <li key={c.id}>
                <SwipeCategoryRow onDelete={() => handleDelete(c.id)}>
                  <div className="group rounded-[var(--radius-card)] border border-line bg-surface px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <NameEditor
                        category={c}
                        onRename={(name) =>
                          renameCategory(c.id, name)
                        }
                      />

                      {/* Desktop delete button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        aria-label="Delete"
                        className="hidden shrink-0 text-ink-muted transition-opacity hover:text-brick md:block md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>

                    <BudgetLimitEditor
                      category={c}
                      spent={spendingByCategory[c.id] ?? 0}
                      onSetBudget={(amount) =>
                        setCategoryBudget(c.id, amount)
                      }
                    />
                  </div>
                </SwipeCategoryRow>
              </li>
            ))}
          </ul>

          <div className="mt-3">
            <AddCategoryForm
              type="expense"
              onAdd={(name) =>
                addCategory(name, 'expense').then(() => {})
              }
            />
          </div>
        </section>

        {/* INCOME */}
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-ink-muted">
            Income
          </h2>

          <ul className="mt-3 flex flex-col gap-1.5">
            {incomeCategories.map((c) => (
              <li key={c.id}>
                <SwipeCategoryRow onDelete={() => handleDelete(c.id)}>
                  <div className="group flex items-center justify-between gap-2 rounded-[var(--radius-card)] border border-line bg-surface px-3 py-2">
                    <NameEditor
                      category={c}
                      onRename={(name) =>
                        renameCategory(c.id, name)
                      }
                    />

                    {/* Desktop delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      aria-label="Delete"
                      className="hidden shrink-0 text-ink-muted transition-opacity hover:text-brick md:block md:opacity-0 md:group-hover:opacity-100"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                </SwipeCategoryRow>
              </li>
            ))}
          </ul>

          <div className="mt-3">
            <AddCategoryForm
              type="income"
              onAdd={(name) =>
                addCategory(name, 'income').then(() => {})
              }
            />
          </div>
        </section>
      </div>
    </div>
  )
}