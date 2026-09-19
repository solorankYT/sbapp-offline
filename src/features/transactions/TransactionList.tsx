
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Repeat,
  ArrowRightLeft,
  Target,
  HandCoins,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm } from '@/features/transactions/TransactionForm'
import { AccountBadge } from '@/features/accounts/AccountBadge'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import {
  formatCurrency,
  formatDate,
  todayISO,
} from '@/lib/format'
import type { TransactionWithRelations } from '@/types'
import { TransferForm } from '@/features/accounts/TransferForm'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDebts } from '@/hooks/useDebts'
import { EditDebtPaymentForm } from '@/features/debts/EditDebtPaymentForm'

type TypeFilter = 'all' | 'income' | 'expense' | 'transfer'

const DELETE_ACTION_WIDTH = 80
const SWIPE_THRESHOLD = 40

const TRANSACTIONS_PER_PAGE = 15

export function TransactionList() {
  const { user } = useAuth()

  const {
    currentWallet,
    loading: walletLoading,
    wallets,
  } = useWallet()

  const { categories } = useCategories(currentWallet?.id)
  const { accounts } = useAccounts(currentWallet?.id)

  const {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    updateTransfer,
    deleteTransaction,
  } = useTransactions(currentWallet?.id)

  const { debts, updatePayment, deletePayment } = useDebts(currentWallet?.id)
  const [editingDebtPayment, setEditingDebtPayment] = useState<TransactionWithRelations | null>(null)

  const [adding, setAdding] = useState(false)

  const [editing, setEditing] =
    useState<TransactionWithRelations | null>(null)

  const [editingTransfer, setEditingTransfer] =
    useState<TransactionWithRelations | null>(null)

  const [repeatingFrom, setRepeatingFrom] =
    useState<TransactionWithRelations | null>(null)


  const [typeFilter, setTypeFilter] =
    useState<TypeFilter>('all')

  const [categoryFilter, setCategoryFilter] =
    useState('')

  const [recurringOnly, setRecurringOnly] =
    useState(false)

  const [search, setSearch] = useState('')

  const [dateFrom, setDateFrom] = useState('')

  const [dateTo, setDateTo] = useState('')

  const [showFilters, setShowFilters] = useState(false)

  /*
   * ---------------------------------------------------------
   * Pagination
   * ---------------------------------------------------------
   */

  const [currentPage, setCurrentPage] = useState(1)

  /*
   * ---------------------------------------------------------
   * Swipe state
   * ---------------------------------------------------------
   */

  const [openTransactionId, setOpenTransactionId] =
    useState<string | null>(null)

  const [dragOffset, setDragOffset] = useState(0)

  const [draggingTransactionId, setDraggingTransactionId] =
    useState<string | null>(null)

  /*
   * Keep the live offset in a ref.
   *
   * This prevents handlePointerUp from reading
   * stale React state during a swipe.
   */
  const dragOffsetRef = useRef(0)

  const pointerIdRef = useRef<number | null>(null)

  const startXRef = useRef(0)

  const startYRef = useRef(0)

  const startOffsetRef = useRef(0)

  const draggingRef = useRef(false)

  const movedRef = useRef(false)

  /*
   * ---------------------------------------------------------
   * Filter transactions
   * ---------------------------------------------------------
   */

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (
        typeFilter !== 'all' &&
        t.type !== typeFilter
      ) {
        return false
      }

      if (
        categoryFilter &&
        t.category_id !== categoryFilter
      ) {
        return false
      }

      if (
        recurringOnly &&
        !t.is_recurring
      ) {
        return false
      }

      if (
        dateFrom &&
        t.date < dateFrom
      ) {
        return false
      }

      if (
        dateTo &&
        t.date > dateTo
      ) {
        return false
      }

      if (
        search &&
        !(t.description ?? '')
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false
      }

      return true
    })
  }, [
    transactions,
    typeFilter,
    categoryFilter,
    recurringOnly,
    dateFrom,
    dateTo,
    search,
  ])

  /*
   * ---------------------------------------------------------
   * Filter information
   * ---------------------------------------------------------
   */

  const hasAdvancedFilters =
    Boolean(
      categoryFilter ||
        recurringOnly ||
        dateFrom ||
        dateTo
    )

  const activeFilterCount =
    Number(Boolean(categoryFilter)) +
    Number(recurringOnly) +
    Number(Boolean(dateFrom)) +
    Number(Boolean(dateTo))

  /*
   * ---------------------------------------------------------
   * Pagination calculations
   * ---------------------------------------------------------
   */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filtered.length /
        TRANSACTIONS_PER_PAGE
    )
  )

  /*
   * Keep current page valid when filtering
   * reduces the number of available pages.
   */
  useEffect(() => {
    setCurrentPage((page) =>
      Math.min(page, totalPages)
    )
  }, [totalPages])

  /*
   * Reset pagination whenever the user
   * changes the search or filters.
   */
  useEffect(() => {
    setCurrentPage(1)
  }, [
    typeFilter,
    categoryFilter,
    recurringOnly,
    search,
    dateFrom,
    dateTo,
  ])

  /*
   * ---------------------------------------------------------
   * Paginated transactions
   * ---------------------------------------------------------
   */

  const paginatedTransactions = useMemo(() => {
    const start =
      (currentPage - 1) *
      TRANSACTIONS_PER_PAGE

    const end =
      start +
      TRANSACTIONS_PER_PAGE

    return filtered.slice(start, end)
  }, [
    filtered,
    currentPage,
  ])

  /*
   * ---------------------------------------------------------
   * Group paginated transactions by date
   * ---------------------------------------------------------
   */

  const groupedTransactions = useMemo(() => {
    const groups: Record<
      string,
      TransactionWithRelations[]
    > = {}

    paginatedTransactions.forEach(
      (transaction) => {
        const key = transaction.date

        if (!groups[key]) {
          groups[key] = []
        }

        groups[key].push(transaction)
      }
    )

    return Object.entries(groups).sort(
      ([a], [b]) =>
        b.localeCompare(a)
    )
  }, [paginatedTransactions])

  /*
   * ---------------------------------------------------------
   * Close swipe action when clicking elsewhere
   * ---------------------------------------------------------
   */

  useEffect(() => {
    function handleOutsidePointerDown(
      event: PointerEvent
    ) {
      const target =
        event.target as HTMLElement

      if (
        !target.closest(
          '[data-swipe-transaction]'
        )
      ) {
        setOpenTransactionId(null)
        setDraggingTransactionId(null)
        setDragOffset(0)
        dragOffsetRef.current = 0
      }
    }

    document.addEventListener(
      'pointerdown',
      handleOutsidePointerDown
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutsidePointerDown
      )
    }
  }, [])

  /*
   * ---------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------
   */

  function setOffset(value: number) {
    dragOffsetRef.current = value
    setDragOffset(value)
  }

  function clearFilters() {
    setCategoryFilter('')
    setRecurringOnly(false)
    setDateFrom('')
    setDateTo('')
  }

  function formatGroupDate(date: string) {
    const transactionDate =
      new Date(`${date}T00:00:00`)

    const today =
      new Date(
        `${todayISO()}T00:00:00`
      )

    const diff =
      Math.round(
        (today.getTime() -
          transactionDate.getTime()) /
          86400000
      )

    if (diff === 0) {
      return 'Today'
    }

    if (diff === 1) {
      return 'Yesterday'
    }

    return formatDate(date)
  }

  /*
   * ---------------------------------------------------------
   * Swipe handlers
   * ---------------------------------------------------------
   */

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    transactionId: string
  ) {
    if (
      event.pointerType === 'mouse' &&
      event.button !== 0
    ) {
      return
    }

    pointerIdRef.current =
      event.pointerId

    startXRef.current =
      event.clientX

    startYRef.current =
      event.clientY

    draggingRef.current = false

    movedRef.current = false

    const isAlreadyOpen =
      openTransactionId ===
      transactionId

    startOffsetRef.current =
      isAlreadyOpen
        ? -DELETE_ACTION_WIDTH
        : 0

    setDraggingTransactionId(
      transactionId
    )

    event.currentTarget.setPointerCapture(
      event.pointerId
    )

    /*
     * Close another open transaction
     * when starting a new swipe.
     */
    if (
      openTransactionId &&
      openTransactionId !==
        transactionId
    ) {
      setOpenTransactionId(null)

      setOffset(0)

      startOffsetRef.current = 0
    }
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (
      pointerIdRef.current !==
      event.pointerId
    ) {
      return
    }

    const deltaX =
      event.clientX -
      startXRef.current

    const deltaY =
      event.clientY -
      startYRef.current

    /*
     * Wait until the user has moved
     * enough to determine direction.
     */
    if (!draggingRef.current) {
      if (
        Math.abs(deltaX) < 6 &&
        Math.abs(deltaY) < 6
      ) {
        return
      }

      /*
       * Vertical movement means normal
       * page scrolling.
       */
      if (
        Math.abs(deltaY) >
        Math.abs(deltaX)
      ) {
        return
      }

      draggingRef.current = true
    }

    movedRef.current = true

    let nextOffset =
      startOffsetRef.current +
      deltaX

    /*
     * Don't swipe to the right.
     */
    nextOffset = Math.min(
      0,
      nextOffset
    )

    /*
     * Don't reveal more than
     * the delete button.
     */
    nextOffset = Math.max(
      -DELETE_ACTION_WIDTH,
      nextOffset
    )

    setOffset(nextOffset)
  }

  function handlePointerUp(
    event: React.PointerEvent<HTMLDivElement>,
    transactionId: string
  ) {
    if (
      pointerIdRef.current !==
      event.pointerId
    ) {
      return
    }

    if (draggingRef.current) {
      const currentOffset =
        dragOffsetRef.current

      if (
        currentOffset <=
        -SWIPE_THRESHOLD
      ) {
        setOpenTransactionId(
          transactionId
        )

        setOffset(
          -DELETE_ACTION_WIDTH
        )
      } else {
        setOpenTransactionId(null)

        setOffset(0)
      }
    }

    draggingRef.current = false

    pointerIdRef.current = null

    setDraggingTransactionId(null)
  }

  function handlePointerCancel() {
    draggingRef.current = false

    pointerIdRef.current = null

    setDraggingTransactionId(null)

    if (openTransactionId) {
      setOffset(
        -DELETE_ACTION_WIDTH
      )
    } else {
      setOffset(0)
    }
  }

  function handleRowClick(
    event: React.MouseEvent
  ) {
    if (movedRef.current) {
      event.preventDefault()

      event.stopPropagation()

      movedRef.current = false
    }
  }

  /*
   * ---------------------------------------------------------
   * Delete
   * ---------------------------------------------------------
   */

async function handleDelete(transaction: TransactionWithRelations) {
  if (window.confirm('Delete this transaction? This action cannot be undone.')) {
    setOpenTransactionId(null)
    setDraggingTransactionId(null)
    setOffset(0)

    if (transaction.debt) {
      await deletePayment(transaction.debt.id, transaction.id, transaction.amount)
    } else {
      await deleteTransaction(transaction.id)
    }
  }
}

  /*
   * ---------------------------------------------------------
   * Loading state
   *
   * IMPORTANT:
   * All hooks are already above this return.
   * This prevents the Rules of Hooks error.
   * ---------------------------------------------------------
   */

  if (walletLoading) {
    return (
      <div className="space-y-5">
        <div>
          <Skeleton className="h-7 w-36 rounded" />

          <Skeleton className="mt-2 h-4 w-28 rounded" />
        </div>

        <Skeleton className="h-10 w-full rounded-[var(--radius-card)]" />

        <div className="space-y-2">
          {Array.from({
            length: 6,
          }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-[60px] w-full rounded-[var(--radius-card)]"
            />
          ))}
        </div>
      </div>
    )
  }

  /*
   * ---------------------------------------------------------
   * No wallet state
   * ---------------------------------------------------------
   */

  if (!currentWallet) {
    return (
      <div>
        <h1 className="font-display text-2xl text-ink">
          Transactions
        </h1>

        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-12 text-center">
          <p className="text-sm text-ink-muted">
            {wallets.length === 0
              ? 'Create a wallet first to start logging transactions.'
              : 'Select a wallet to see its transactions.'}
          </p>
        </div>
      </div>
    )
  }

  /*
   * ---------------------------------------------------------
   * Render
   * ---------------------------------------------------------
   */

  return (
    <div className="pb-8">
    

      {/* Search + Filters */}
      <section className="mt-2">
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search transactions"
              aria-label="Search transactions"
              className="h-10 w-full rounded-[var(--radius-card)] border border-line bg-surface pl-9 pr-9 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-pine focus:ring-2 focus:ring-pine/10"
            />

            {search ? (
              <button
                type="button"
                onClick={() =>
                  setSearch('')
                }
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>

          {/* Filters */}
          <button
            type="button"
            onClick={() =>
              setShowFilters(
                (value) => !value
              )
            }
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-card)] border px-3 text-sm font-medium transition-colors ${
              showFilters ||
              hasAdvancedFilters
                ? 'border-pine bg-pine-soft text-pine'
                : 'border-line bg-surface text-ink-muted hover:text-ink'
            }`}
          >
            <SlidersHorizontal
              size={15}
            />

            Filters

            {activeFilterCount >
            0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-pine px-1 text-[11px] text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        {/* Transaction type tabs */}
        <div className="mt-3 flex overflow-x-auto border-b border-line">
          {(
            [
              ['all', 'All'],
              ['expense', 'Expenses'],
              ['income', 'Income'],
              ['transfer', 'Transfers'],
            ] as const
          ).map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setTypeFilter(
                    value
                  )
                }
                className={`relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors ${
                  typeFilter === value
                    ? 'text-pine'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {label}

                {typeFilter ===
                value ? (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-pine" />
                ) : null}
              </button>
            )
          )}
        </div>

        {/* Advanced filters */}
        {showFilters ? (
          <div className="mt-3 rounded-[var(--radius-card)] border border-line bg-paper p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Category */}
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-ink-muted">
                  Category
                </span>

                <select
                  value={
                    categoryFilter
                  }
                  onChange={(e) =>
                    setCategoryFilter(
                      e.target.value
                    )
                  }
                  className="h-9 w-full rounded-[var(--radius-card)] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-pine focus:ring-2 focus:ring-pine/10"
                >
                  <option value="">
                    All categories
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              {/* From */}
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-ink-muted">
                  From
                </span>

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) =>
                    setDateFrom(
                      e.target.value
                    )
                  }
                  className="h-9 w-full rounded-[var(--radius-card)] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-pine focus:ring-2 focus:ring-pine/10"
                />
              </label>

              {/* To */}
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-ink-muted">
                  To
                </span>

                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) =>
                    setDateTo(
                      e.target.value
                    )
                  }
                  className="h-9 w-full rounded-[var(--radius-card)] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-pine focus:ring-2 focus:ring-pine/10"
                />
              </label>

              {/* Recurring */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() =>
                    setRecurringOnly(
                      (value) =>
                        !value
                    )
                  }
                  className={`flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border px-3 text-sm font-medium transition-colors ${
                    recurringOnly
                      ? 'border-pine bg-pine-soft text-pine'
                      : 'border-line bg-surface text-ink-muted hover:text-ink'
                  }`}
                >
                  <Repeat
                    size={14}
                  />

                  Recurring only
                </button>
              </div>
            </div>

            {hasAdvancedFilters ? (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="mt-3 text-xs font-medium text-ink-muted hover:text-brick"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Result summary */}
      {!loading &&
      transactions.length >
        0 ? (
        <div className="mt-5 flex items-center justify-between">
          

          {hasAdvancedFilters ||
          search ? (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                clearFilters()
              }}
              className="text-xs font-medium text-pine hover:underline"
            >
              Reset
            </button>
           ) : null}
        </div>
      ) : null}

      {/* Transaction list */}
      <div className="mt-3">
        {loading ? (
          <ul className="space-y-2">
            {Array.from({
              length: 6,
            }).map((_, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />

                  <div>
                    <Skeleton className="h-3.5 w-32 rounded" />

                    <Skeleton className="mt-1.5 h-3 w-24 rounded" />
                  </div>
                </div>

                <Skeleton className="h-3.5 w-16 shrink-0 rounded" />
              </li>
            ))}
          </ul>
        ) : filtered.length ===
          0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line px-6 py-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-paper text-ink-muted">
              <Search
                size={18}
              />
            </div>

            <p className="mt-3 text-sm font-medium text-ink">
              {transactions.length ===
              0
                ? 'No transactions yet'
                : 'No matching transactions'}
            </p>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-ink-muted">
              {transactions.length ===
              0
                ? 'Start tracking your spending by adding your first transaction.'
                : 'Try changing your search or removing some filters.'}
            </p>

            {transactions.length ===
            0 ? (
              <Button
                onClick={() =>
                  setAdding(true)
                }
                className="mt-4"
              >
                <Plus size={15} />
                Add transaction
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  clearFilters()
                }}
                className="mt-4 text-sm font-medium text-pine hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Transaction groups */}
            <div className="space-y-5">
              {groupedTransactions.map(
                ([date, group]) => (
                  <section
                    key={date}
                  >
                    <div className="mb-2 px-1">
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {formatGroupDate(
                          date
                        )}
                      </h2>
                    </div>

                    <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                      {group.map(
                        (
                          t,
                          index
                        ) => {
                          const isMine =
                            t.user_id ===
                            user?.id

                          const isTransfer =
                            t.type ===
                            'transfer'

                          const isOpen =
                            openTransactionId ===
                            t.id

                          const isDragging =
                            draggingTransactionId ===
                            t.id

                          const currentOffset =
                            isDragging
                              ? dragOffset
                              : isOpen
                                ? -DELETE_ACTION_WIDTH
                                : 0

                          return (
                            <li
                              key={
                                t.id
                              }
                              data-swipe-transaction
                              className={`relative overflow-hidden ${
                                index >
                                0
                                  ? 'border-t border-line'
                                  : ''
                              }`}
                            >
                              {/* Delete */}
                              {isMine ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      t
                                    )
                                  }
                                  aria-label={`Delete ${
                                    t.description ||
                                    'transaction'
                                  }`}
                                  tabIndex={
                                    isOpen
                                      ? 0
                                      : -1
                                  }
                                  className={`absolute inset-y-0 right-0 flex w-20 items-center justify-center gap-1 bg-brick text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${
                                    isOpen
                                      ? 'translate-x-0'
                                      : 'translate-x-full'
                                  }`}
                                >
                                  <Trash2
                                    size={
                                      16
                                    }
                                  />

                                  <span className="text-xs font-medium">
                                    Delete
                                  </span>
                                </button>
                              ) : null}

                              {/* Main row */}
                              <div
                                className="relative flex min-h-[64px] items-center justify-between gap-3 bg-surface px-3 py-3 sm:px-4"
                                style={{
                                  transform: `translateX(${currentOffset}px)`,

                                  transition:
                                    isDragging
                                      ? 'none'
                                      : 'transform 180ms ease-out',

                                  touchAction:
                                    'pan-y',
                                }}
                                onPointerDown={(
                                  event
                                ) =>
                                  handlePointerDown(
                                    event,
                                    t.id
                                  )
                                }
                                onPointerMove={
                                  handlePointerMove
                                }
                                onPointerUp={(
                                  event
                                ) =>
                                  handlePointerUp(
                                    event,
                                    t.id
                                  )
                                }
                                onPointerCancel={
                                  handlePointerCancel
                                }
                                onClick={
                                  handleRowClick
                                }
                              >
                              {/* Left side */}
                              <div className="flex min-w-0 items-center gap-3">
                                {/* Account / wallet logo */}
                                {isTransfer ? (
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-ink-muted">
                                    {t.debt ? (
                                      <HandCoins size={15} />
                                    ) : t.goal ? (
                                      <Target size={15} />
                                    ) : (
                                      <ArrowRightLeft size={15} />
                                    )}
                                  </span>
                                ) : t.account ? (
                                  <AccountBadge account={t.account} size={32} />
                                ) : (
                                  <span className="h-8 w-8 shrink-0 rounded-full bg-paper" />
                                )}

                                {/* Title + category */}
                                <div className="min-w-0">
                                  {isTransfer ? (
                                    <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-ink">
                                      <span className="truncate">
                                        {t.account?.name ?? '—'}
                                      </span>

                                      <ArrowRightLeft
                                        size={12}
                                        className="shrink-0 text-ink-muted"
                                      />

                                      <span className="truncate">
                                        {t.debt
                                          ? `${
                                              (
                                                t.debt as {
                                                  direction?: 'i_owe' | 'owed_to_me'
                                                  person_name?: string
                                                }
                                              ).direction === 'owed_to_me'
                                                ? 'Owed by'
                                                : 'Owed to'
                                            } ${
                                              (
                                                t.debt as {
                                                  person_name?: string
                                                }
                                              ).person_name ?? '—'
                                            }`
                                          : t.goal
                                            ? `Goal: ${t.goal.name}`
                                            : t.toAccount?.name ?? '—'}
                                      </span>
                                    </p>
                                  ) : (
                                    <p className="truncate text-sm font-medium text-ink">
                                      {t.description ||
                                        t.category?.name ||
                                        'Transaction'}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                                    <span className="truncate">
                                      {t.debt
                                        ? 'Debt'
                                        : t.goal
                                          ? 'Goal contribution'
                                          : isTransfer
                                            ? 'Transfer'
                                            : t.category?.name || 'Uncategorized'}
                                    </span>

                                    {t.is_recurring ? (
                                      <span
                                        className="inline-flex shrink-0 items-center"
                                        title="Recurring transaction"
                                      >
                                        <Repeat size={11} />
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                                {/* Right side */}
                                <div className="flex shrink-0 items-center gap-2">
                                  {/* Amount */}
                                  <span
                                    className={`font-tabular text-sm font-medium ${
                                      isTransfer
                                        ? 'text-ink-muted'
                                        : t.type ===
                                            'income'
                                          ? 'text-pine'
                                          : 'text-brick'
                                    }`}
                                  >
                                    {isTransfer
                                      ? ''
                                      : t.type ===
                                          'income'
                                        ? '+'
                                        : '−'}

                                    {formatCurrency(
                                      t.amount
                                    )}
                                  </span>

                                  {/* Desktop actions */}
                                  <div className="hidden items-center gap-1 sm:flex">
                                    {t.is_recurring ? (
                                      <button
                                        type="button"
                                        onClick={(
                                          event
                                        ) => {
                                          event.stopPropagation()

                                          setOpenTransactionId(
                                            null
                                          )

                                          setOffset(
                                            0
                                          )

                                          setRepeatingFrom(
                                            t
                                          )
                                        }}
                                        aria-label="Log again this month"
                                        title="Log again this month"
                                        className="rounded-md p-1.5 text-ink-muted hover:bg-paper hover:text-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
                                      >
                                        <Repeat
                                          size={
                                            14
                                          }
                                        />
                                      </button>
                                    ) : null}

                                {isMine ? (
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        if (t.debt) {
                                          setEditingDebtPayment(t)
                                        } else if (isTransfer) {
                                          if (t.account_id && t.to_account_id) setEditingTransfer(t)
                                        } else {
                                          setEditing(t)
                                        }
                                      }}
                                      aria-label={t.debt ? 'Edit payment' : isTransfer ? 'Edit transfer' : 'Edit transaction'}
                                      className="rounded-md p-1.5 text-ink-muted hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                  ) : null}
                                  </div>

                                  {/* Mobile action */}
                                  <button
                                    type="button"
                                    aria-label="Transaction actions"
                                    className="rounded-md p-1 text-ink-muted hover:bg-paper hover:text-ink sm:hidden"
                                    onPointerDown={(event) => {
                                      event.stopPropagation()
                                    }}
                                   onClick={(event) => {
                                    event.stopPropagation()

                                    setOpenTransactionId(null)
                                    setDraggingTransactionId(null)
                                    setOffset(0)

                                    if (isMine) {
                                      if (t.debt) {
                                        setEditingDebtPayment(t)
                                      } else if (isTransfer) {
                                        if (t.account_id && t.to_account_id) {
                                          setEditingTransfer(t)
                                        }
                                      } else {
                                        setEditing(t)
                                      }
                                    }
                                  }}
                                  >
                                    <ChevronDown size={15} />
                                  </button>
                                </div>
                              </div>
                            </li>
                          )
                        }
                      )}
                    </ul>
                  </section>
                )
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 ? (
              <nav
                className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4"
                aria-label="Transaction pagination"
              >
                {/* Previous */}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  disabled={
                    currentPage ===
                    1
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-card)] border border-line bg-surface px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft
                    size={15}
                  />

                  <span className="hidden sm:inline">
                    Previous
                  </span>
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from(
                    {
                      length: totalPages,
                    },
                    (_, index) =>
                      index + 1
                  ).map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                        aria-current={
                          currentPage ===
                          page
                            ? 'page'
                            : undefined
                        }
                        className={`flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-card)] px-2 text-sm font-medium transition-colors ${
                          currentPage ===
                          page
                            ? 'bg-pine text-white'
                            : 'text-ink-muted hover:bg-paper hover:text-ink'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                {/* Next */}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-card)] border border-line bg-surface px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                >
                  <span className="hidden sm:inline">
                    Next
                  </span>

                  <ChevronRight
                    size={15}
                  />
                </button>
              </nav>
            ) : null}

            {/* Pagination summary */}
            {filtered.length >
            TRANSACTIONS_PER_PAGE ? (
              <p className="mt-3 text-center text-xs text-ink-muted">
                Showing{' '}
                {Math.min(
                  (currentPage -
                    1) *
                    TRANSACTIONS_PER_PAGE +
                    1,
                  filtered.length
                )}
                –
                {Math.min(
                  currentPage *
                    TRANSACTIONS_PER_PAGE,
                  filtered.length
                )}{' '}
                of {filtered.length}
              </p>
            ) : null}
          </>
        )}
      </div>

      {/* Add transaction */}
      {adding ? (
        <Modal
          title="Add transaction"
          onClose={() =>
            setAdding(false)
          }
        >
          <TransactionForm
            categories={
              categories
            }
            accounts={accounts}
            onSubmit={
              addTransaction
            }
            onDone={() =>
              setAdding(false)
            }
          />
        </Modal>
      ) : null}

      {/* Edit transaction */}
      {editing ? (
        <Modal
          title="Edit transaction"
          onClose={() =>
            setEditing(null)
          }
        >
          <TransactionForm
            categories={
              categories
            }
            accounts={accounts}
            submitLabel="Save changes"
            initial={{
              type: editing.type as
                | 'income'
                | 'expense',
              amount:
                editing.amount,
              categoryId:
                editing.category_id,
              accountId:
                editing.account_id,
              description:
                editing.description ??
                '',
              date: editing.date,
              isRecurring:
                editing.is_recurring,
            }}
            onSubmit={(input) =>
              updateTransaction(
                editing.id,
                input
              )
            }
            onDone={() =>
              setEditing(null)
            }
          />
        </Modal>
      ) : null}

      {editingDebtPayment && editingDebtPayment.debt ? (
          <Modal title="Edit payment" onClose={() => setEditingDebtPayment(null)}>
            <EditDebtPaymentForm
              debt={debts.find((d) => d.id === editingDebtPayment.debt!.id)!}
              transaction={editingDebtPayment}
              accounts={accounts}
              onSubmit={(amount, accountId, date, note) =>
                updatePayment(editingDebtPayment.debt!.id, editingDebtPayment.id, editingDebtPayment.amount, amount, accountId, date, note)
              }
              onDone={() => setEditingDebtPayment(null)}
            />
          </Modal>
        ) : null}

      {/* Edit transfer */}
      {editingTransfer ? (
        <Modal
          title="Edit transfer"
          onClose={() =>
            setEditingTransfer(
              null
            )
          }
        >
          <TransferForm
            accounts={accounts}
            submitLabel="Save changes"
            initial={{
              fromAccountId:
                editingTransfer.account_id!,
              toAccountId:
                editingTransfer.to_account_id!,
              amount:
                editingTransfer.amount,
              description:
                editingTransfer.description ??
                '',
              date:
                editingTransfer.date,
            }}
            onSubmit={(input) =>
              updateTransfer(
                editingTransfer.id,
                input
              )
            }
            onDone={() =>
              setEditingTransfer(
                null
              )
            }
          />
        </Modal>
      ) : null}

      {/* Repeat transaction */}
      {repeatingFrom ? (
        <Modal
          title="Log recurring transaction"
          onClose={() =>
            setRepeatingFrom(
              null
            )
          }
        >
          <TransactionForm
            categories={
              categories
            }
            accounts={accounts}
            submitLabel="Add transaction"
            initial={{
              type: repeatingFrom.type as
                | 'income'
                | 'expense',
              amount:
                repeatingFrom.amount,
              categoryId:
                repeatingFrom.category_id,
              accountId:
                repeatingFrom.account_id,
              description:
                repeatingFrom.description ??
                '',
              date: todayISO(),
              isRecurring: true,
            }}
            onSubmit={
              addTransaction
            }
            onDone={() =>
              setRepeatingFrom(
                null
              )
            }
          />
        </Modal>
      ) : null}
    </div>
  )
}
