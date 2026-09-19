
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/Modal'
import { BillForm } from '@/features/bills/BillForm'
import { MarkPaidForm } from '@/features/bills/MarkPaidForm'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import { useBills } from '@/hooks/useBills'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { formatCurrency } from '@/lib/format'
import { getBillTypePreset } from '@/lib/billTypes'
import type { Bill } from '@/types'

function ordinal(n: number) {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = n % 100

  return `${n}${
    suffixes[(v - 20) % 10] ||
    suffixes[v] ||
    suffixes[0]
  }`
}

const SWIPE_ACTION_WIDTH = 82
const SWIPE_OPEN_THRESHOLD = 45
const SWIPE_CLOSE_THRESHOLD = 25

export function BillList() {
  const { user } = useAuth()

  const {
    currentWallet,
    loading: walletLoading,
    wallets,
  } = useWallet()

  const {
    bills,
    paidBillIds,
    loading,
    createBill,
    updateBill,
    deleteBill,
    markAsPaid,
  } = useBills(currentWallet?.id)

  const { categories } = useCategories(
    currentWallet?.id,
  )

  const { accounts } = useAccounts(
    currentWallet?.id,
  )

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Bill | null>(null)
  const [payingFor, setPayingFor] = useState<Bill | null>(null)

  const [openSwipeId, setOpenSwipeId] = useState<
    string | null
  >(null)

  const todayDay = new Date().getDate()

  const {
    sortedBills,
    unpaidTotal,
    unpaidCount,
  } = useMemo(() => {
    let total = 0
    let count = 0

    for (const bill of bills) {
      if (!paidBillIds.has(bill.id)) {
        total += bill.amount
        count += 1
      }
    }

    const sorted = [...bills].sort((a, b) => {
      const aPaid = paidBillIds.has(a.id)
      const bPaid = paidBillIds.has(b.id)

      if (aPaid !== bPaid) {
        return aPaid ? 1 : -1
      }

      return a.due_day - b.due_day
    })

    return {
      sortedBills: sorted,
      unpaidTotal: total,
      unpaidCount: count,
    }
  }, [bills, paidBillIds])

  if (walletLoading) {
    return null
  }

  if (!currentWallet) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Bills
          </h1>
        </div>

        <div className="rounded-[var(--radius-card)] bg-surface px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-ink-muted">
            {wallets.length === 0
              ? 'Create a wallet first to start tracking your bills.'
              : 'Select a wallet to see its bills.'}
          </p>

          {wallets.length === 0 ? (
            <Link
              to="/wallets"
              className="mt-4 inline-flex text-sm font-medium text-pine hover:underline"
            >
              Create a wallet
            </Link>
          ) : null}
        </div>
      </div>
    )
  }

  async function handleDelete(bill: Bill) {
    const confirmed = window.confirm(
      `Delete "${bill.name}"? This can't be undone.`,
    )

    if (!confirmed) {
      return
    }

    await deleteBill(bill.id)
    setOpenSwipeId(null)
  }

  return (
    <div
      className="space-y-6"
      onClick={() => {
        if (openSwipeId) {
          setOpenSwipeId(null)
        }
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Bills
          </h1>

          <p className="mt-1 text-sm text-ink-muted">
            {currentWallet.name}
          </p>
        </div>

        <Button
          onClick={(event) => {
            event.stopPropagation()
            setCreating(true)
          }}
          className="w-full sm:w-auto"
        >
          <Plus
            size={17}
            strokeWidth={2}
          />

          Add bill
        </Button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary                                                            */}
      {/* ------------------------------------------------------------------ */}

      {bills.length > 0 ? (
        <div className="rounded-[var(--radius-card)] bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Unpaid this month
              </p>

              <p className="mt-1.5 font-display text-2xl font-semibold text-ink">
                {formatCurrency(unpaidTotal)}
              </p>
            </div>

            <div className="rounded-full bg-background px-3 py-1.5 text-xs font-medium text-ink-muted">
              {unpaidCount}{' '}
              {unpaidCount === 1
                ? 'bill'
                : 'bills'}{' '}
              unpaid
            </div>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Bills                                                              */}
      {/* ------------------------------------------------------------------ */}

      <div>
        {loading ? (
          <div className="rounded-[var(--radius-card)] bg-surface px-6 py-10 text-center shadow-sm">
            <p className="text-sm text-ink-muted">
              Loading bills…
            </p>
          </div>
        ) : sortedBills.length === 0 ? (
          <div className="rounded-[var(--radius-card)] bg-surface px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-background">
              <Plus
                size={18}
                className="text-ink-muted"
              />
            </div>

            <p className="mt-4 text-sm font-medium text-ink">
              No bills yet
            </p>

            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
              Add rent, utilities, subscriptions, or
              other recurring bills to keep track of
              what’s due.
            </p>

            <Button
              onClick={(event) => {
                event.stopPropagation()
                setCreating(true)
              }}
              className="mt-5"
            >
              <Plus
                size={16}
                strokeWidth={2}
              />

              Add your first bill
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBills.map((bill) => {
              const isPaid = paidBillIds.has(
                bill.id,
              )

              const isOverdue =
                !isPaid &&
                todayDay > bill.due_day

              const isDueSoon =
                !isPaid &&
                !isOverdue &&
                bill.due_day - todayDay <= 3

              const preset = getBillTypePreset(
                bill.bill_type,
              )

              const TypeIcon = preset.icon

              return (
                <SwipeableBill
                  key={bill.id}
                  bill={bill}
                  isPaid={isPaid}
                  isOverdue={isOverdue}
                  isDueSoon={isDueSoon}
                  preset={preset}
                  TypeIcon={TypeIcon}
                  isOpen={
                    openSwipeId === bill.id
                  }
                  onOpen={() => {
                    setOpenSwipeId(bill.id)
                  }}
                  onClose={() => {
                    setOpenSwipeId(null)
                  }}
                  onDelete={() =>
                    handleDelete(bill)
                  }
                  onEdit={() => {
                    setOpenSwipeId(null)
                    setEditing(bill)
                  }}
                  onMarkPaid={() => {
                    setOpenSwipeId(null)
                    setPayingFor(bill)
                  }}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Add bill modal                                                     */}
      {/* ------------------------------------------------------------------ */}

      {creating ? (
        <Modal
          title="Add bill"
          onClose={() => setCreating(false)}
        >
          <BillForm
            categories={categories}
            accounts={accounts}
            onSubmit={createBill}
            onDone={() => setCreating(false)}
          />
        </Modal>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Edit bill modal                                                    */}
      {/* ------------------------------------------------------------------ */}

      {editing ? (
        <Modal
          title="Edit bill"
          onClose={() => setEditing(null)}
        >
          <BillForm
            bill={editing}
            categories={categories}
            accounts={accounts}
            onSubmit={(input) =>
              updateBill(editing.id, input)
            }
            onDone={() => setEditing(null)}
          />
        </Modal>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Mark paid modal                                                    */}
      {/* ------------------------------------------------------------------ */}

      {payingFor ? (
        <Modal
          title={`Mark "${payingFor.name}" as paid`}
          onClose={() => setPayingFor(null)}
        >
          <MarkPaidForm
            bill={payingFor}
            accounts={accounts}
            onSubmit={(amount, accountId) =>
              user
                ? markAsPaid(
                    payingFor,
                    amount,
                    accountId,
                    user.id,
                  )
                : Promise.resolve({
                    error: 'Not signed in',
                  })
            }
            onDone={() => setPayingFor(null)}
          />
        </Modal>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Swipeable Bill                                                             */
/* -------------------------------------------------------------------------- */

type SwipeableBillProps = {
  bill: Bill
  isPaid: boolean
  isOverdue: boolean
  isDueSoon: boolean
  preset: ReturnType<typeof getBillTypePreset>
  TypeIcon: ReturnType<
    typeof getBillTypePreset
  >['icon']
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onDelete: () => void
  onEdit: () => void
  onMarkPaid: () => void
}

function SwipeableBill({
  bill,
  isPaid,
  isOverdue,
  isDueSoon,
  preset,
  isOpen,
  onOpen,
  onClose,
  onDelete,
  onEdit,
  onMarkPaid,
}: SwipeableBillProps) {
  const [offset, setOffset] = useState(0)

  const startX = useRef<number | null>(
    null,
  )

  const startY = useRef<number | null>(
    null,
  )

  const startOffset = useRef(0)

  const dragging = useRef(false)

  const horizontalSwipe = useRef(false)

  /*
   * Keep the local animation state synchronized
   * with the parent list.
   */
  useEffect(() => {
    if (!dragging.current) {
      setOffset(
        isOpen
          ? -SWIPE_ACTION_WIDTH
          : 0,
      )
    }
  }, [isOpen])

  function clampOffset(value: number) {
    /*
     * Allow a little resistance if the user
     * pulls beyond the delete button.
     */
    const maxOverscroll = 18

    return Math.max(
      -SWIPE_ACTION_WIDTH -
        maxOverscroll,
      Math.min(0, value),
    )
  }

  function handleTouchStart(
    event: React.TouchEvent<HTMLDivElement>,
  ) {
    const touch = event.touches[0]

    startX.current = touch.clientX
    startY.current = touch.clientY

    startOffset.current = isOpen
      ? -SWIPE_ACTION_WIDTH
      : 0

    dragging.current = true
    horizontalSwipe.current = false
  }

  function handleTouchMove(
    event: React.TouchEvent<HTMLDivElement>,
  ) {
    if (
      !dragging.current ||
      startX.current === null ||
      startY.current === null
    ) {
      return
    }

    const touch = event.touches[0]

    const deltaX =
      touch.clientX - startX.current

    const deltaY =
      touch.clientY - startY.current

    /*
     * Determine whether this is a vertical
     * scroll or horizontal swipe.
     */
    if (!horizontalSwipe.current) {
      if (
        Math.abs(deltaY) >
          Math.abs(deltaX) &&
        Math.abs(deltaY) > 8
      ) {
        dragging.current = false
        return
      }

      if (Math.abs(deltaX) > 8) {
        horizontalSwipe.current = true
      }
    }

    if (!horizontalSwipe.current) {
      return
    }

    const nextOffset = clampOffset(
      startOffset.current + deltaX,
    )

    setOffset(nextOffset)
  }

  function finishSwipe() {
    if (!dragging.current) {
      return
    }

    dragging.current = false

    const currentOffset = offset

    /*
     * Closed → Open
     */
    if (
      !isOpen &&
      currentOffset <=
        -SWIPE_OPEN_THRESHOLD
    ) {
      setOffset(-SWIPE_ACTION_WIDTH)
      onOpen()
    }

    /*
     * Open → Closed
     */
    else if (
      isOpen &&
      currentOffset >
        -SWIPE_ACTION_WIDTH +
          SWIPE_CLOSE_THRESHOLD
    ) {
      setOffset(0)
      onClose()
    }

    /*
     * Snap back to current state.
     */
    else if (isOpen) {
      setOffset(-SWIPE_ACTION_WIDTH)
    } else {
      setOffset(0)
    }

    startX.current = null
    startY.current = null
    horizontalSwipe.current = false
  }

  function handleTouchEnd() {
    finishSwipe()
  }

  function handleTouchCancel() {
    dragging.current = false
    horizontalSwipe.current = false

    startX.current = null
    startY.current = null

    setOffset(
      isOpen
        ? -SWIPE_ACTION_WIDTH
        : 0,
    )
  }

  function handleClick(
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    /*
     * If the row is currently displaced,
     * treat a click as an attempt to close it.
     */
    if (Math.abs(offset) > 5) {
      event.stopPropagation()

      if (isOpen) {
        setOffset(0)
        onClose()
      }

      return
    }
  }

  const isDragging = dragging.current

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-card)]"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Delete action                                                     */}
      {/* ---------------------------------------------------------------- */}

      <div className="absolute inset-y-0 right-0 w-[82px] overflow-hidden rounded-r-[var(--radius-card)] bg-brick">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-white transition-opacity hover:opacity-90 active:opacity-75"
          aria-label={`Delete ${bill.name}`}
        >
          <Trash2
            size={19}
            strokeWidth={2}
          />

          <span className="text-[11px] font-semibold">
            Delete
          </span>
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Bill card                                                         */}
      {/* ---------------------------------------------------------------- */}

      <div
        className={`relative rounded-[var(--radius-card)] bg-surface p-4 shadow-sm ${
          isPaid
            ? 'opacity-70'
            : ''
        }`}
        style={{
          transform: `translate3d(${offset}px, 0, 0)`,

          transition: isDragging
            ? 'none'
            : 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',

          /*
           * Allows vertical scrolling while
           * still supporting horizontal gestures.
           */
          touchAction: 'pan-y',

          willChange: 'transform',
        }}
      >
        <div className="flex items-start gap-3">
          {/* ------------------------------------------------------------ */}
          {/* Bill icon                                                     */}
          {/* ------------------------------------------------------------ */}

          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor:
                `${preset.color}18`,
              color: preset.color,
            }}
          >
            {preset.logo ? (
              <img
                src={preset.logo}
                alt=""
                className="h-5 w-5 object-contain"
              />
            ) : preset.icon ? (
              <preset.icon
                size={18}
                strokeWidth={2}
              />
            ) : null}
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Bill information                                               */}
          {/* ------------------------------------------------------------ */}

          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className={`truncate text-sm font-semibold ${
                isPaid
                  ? 'text-ink-muted'
                  : 'text-ink'
              }`}
            >
              {bill.name}
            </p>

            <div className="mt-1">
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-pine">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-pine/10">
                    <Check
                      size={10}
                      strokeWidth={2.5}
                    />
                  </span>

                  Paid this month
                </span>
              ) : isOverdue ? (
                <span className="text-xs font-medium text-brick">
                  Overdue ·{' '}
                  {ordinal(
                    bill.due_day,
                  )}
                </span>
              ) : isDueSoon ? (
                <span className="text-xs font-medium text-gold">
                  Due soon ·{' '}
                  {ordinal(
                    bill.due_day,
                  )}
                </span>
              ) : (
                <span className="text-xs text-ink-muted">
                  Due on the{' '}
                  {ordinal(
                    bill.due_day,
                  )}
                </span>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Amount + edit                                                  */}
          {/* ------------------------------------------------------------ */}

          <div className="flex shrink-0 items-center gap-1">
            <span className="font-tabular text-base font-semibold text-ink">
              {formatCurrency(
                bill.amount,
              )}
            </span>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()

                setOffset(0)
                onClose()
                onEdit()
              }}
              aria-label={`Edit ${bill.name}`}
              title="Edit bill"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-background hover:text-ink active:scale-95"
            >
              <Pencil
                size={15}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Mark paid                                                       */}
        {/* -------------------------------------------------------------- */}

        {!isPaid ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()

              setOffset(0)
              onClose()
              onMarkPaid()
            }}
            className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-pine/10 px-4 text-sm font-medium text-pine transition-colors hover:bg-pine/15 active:scale-[0.99]"
          >
            <Check
              size={15}
              strokeWidth={2.2}
            />

            Mark as paid
          </button>
        ) : (
          <div className="mt-4 flex min-h-10 w-full items-center justify-center rounded-lg bg-background text-xs font-medium text-ink-muted">
            Paid for this month
          </div>
        )}
      </div>
    </div>
  )
}
