
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'

import { Modal } from '@/components/ui/Modal'
import { MarkPaidForm } from '@/features/bills/MarkPaidForm'
import { useAuth } from '@/hooks/useAuth'
import { useBills } from '@/hooks/useBills'
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

export function UpcomingBills({
  walletId,
}: {
  walletId: string | undefined
}) {
  const { user } = useAuth()

  const {
    bills,
    paidBillIds,
    markAsPaid,
  } = useBills(walletId)

  const { accounts } = useAccounts(walletId)

  const [payingFor, setPayingFor] =
    useState<Bill | null>(null)

  const todayDay = new Date().getDate()

  const unpaidSorted = useMemo(() => {
    return bills
      .filter((bill) => !paidBillIds.has(bill.id))
      .sort((a, b) => {
        const aOverdue =
          todayDay > a.due_day

        const bOverdue =
          todayDay > b.due_day

        /*
         * Overdue bills always appear first.
         */
        if (aOverdue !== bOverdue) {
          return aOverdue ? -1 : 1
        }

        return a.due_day - b.due_day
      })
  }, [bills, paidBillIds, todayDay])

  if (bills.length === 0) {
    return null
  }

  if (unpaidSorted.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
            <Check
              size={17}
              strokeWidth={2.2}
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              All bills paid
            </p>

            <p className="mt-0.5 text-xs text-ink-muted">
              You’re all caught up for this month.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-[var(--radius-card)] bg-surface p-4 shadow-sm">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Upcoming bills
            </h2>

            <p className="mt-0.5 text-xs text-ink-muted">
              {unpaidSorted.length}{' '}
              {unpaidSorted.length === 1
                ? 'bill'
                : 'bills'}{' '}
              remaining
            </p>
          </div>

          <Link
            to="/bills"
            className="group flex shrink-0 items-center gap-1 text-xs font-semibold text-pine"
          >
            View all

            <ArrowRight
              size={13}
              strokeWidth={2}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Bill list                                                        */}
        {/* ---------------------------------------------------------------- */}

        <ul className="mt-4">
          {unpaidSorted
            .slice(0, 4)
            .map((bill, index) => {
              const isOverdue =
                todayDay > bill.due_day

              const isDueSoon =
                !isOverdue &&
                bill.due_day - todayDay <= 3

              const billType =
                bill.bill_type || 'other'

              const preset =
                getBillTypePreset(
                  billType,
                )

              const color =
                preset?.color ?? '#2f6f5d'

              const Icon =
                preset?.icon ?? Check

              return (
                <li
                  key={bill.id}
                  className={`${
                    index > 0
                      ? 'border-t border-line'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 py-3">
                    {/* -------------------------------------------------- */}
                    {/* Bill icon                                           */}
                    {/* -------------------------------------------------- */}

                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${color}18`,
                        color,
                      }}
                    >
                      {preset?.logo ? (
                        <img
                          src={preset.logo}
                          alt=""
                          className="h-5 w-5 object-contain"
                        />
                      ) : (
                        <Icon
                          size={17}
                          strokeWidth={2}
                        />
                      )}
                    </div>

                    {/* -------------------------------------------------- */}
                    {/* Bill details                                        */}
                    {/* -------------------------------------------------- */}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {bill.name}
                      </p>

                      <p className="mt-0.5 truncate text-xs">
                        {isOverdue ? (
                          <span className="font-medium text-brick">
                            Overdue · due the{' '}
                            {ordinal(
                              bill.due_day,
                            )}
                          </span>
                        ) : isDueSoon ? (
                          <span className="font-medium text-gold">
                            Due soon ·{' '}
                            {ordinal(
                              bill.due_day,
                            )}
                          </span>
                        ) : (
                          <span className="text-ink-muted">
                            Due the{' '}
                            {ordinal(
                              bill.due_day,
                            )}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* -------------------------------------------------- */}
                    {/* Amount                                               */}
                    {/* -------------------------------------------------- */}

                    <div className="shrink-0 text-right">
                      <p className="font-tabular text-sm font-semibold text-ink">
                        {formatCurrency(
                          bill.amount,
                        )}
                      </p>
                    </div>

                    {/* -------------------------------------------------- */}
                    {/* Mark paid                                            */}
                    {/* -------------------------------------------------- */}

                    <button
                      type="button"
                      onClick={() =>
                        setPayingFor(bill)
                      }
                      aria-label={`Mark ${bill.name} as paid`}
                      title="Mark as paid"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pine/10 text-pine transition-colors hover:bg-pine/15 active:scale-95"
                    >
                      <Check
                        size={16}
                        strokeWidth={2.3}
                      />
                    </button>
                  </div>
                </li>
              )
            })}
        </ul>

        {/* ---------------------------------------------------------------- */}
        {/* More bills                                                       */}
        {/* ---------------------------------------------------------------- */}

        {unpaidSorted.length > 4 ? (
          <Link
            to="/bills"
            className="mt-1 flex items-center justify-center rounded-lg bg-background py-2.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
          >
            View {unpaidSorted.length - 4}{' '}
            more{' '}
            {unpaidSorted.length - 4 === 1
              ? 'bill'
              : 'bills'}
          </Link>
        ) : null}
      </div>

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
            onDone={() =>
              setPayingFor(null)
            }
          />
        </Modal>
      ) : null}
    </>
  )
}
