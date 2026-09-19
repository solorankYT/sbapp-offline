import { useState } from 'react'
import { Pencil, Trash2, Users, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/Modal'
import { WalletForm } from '@/features/wallets/WalletForm'
import { WalletMembers } from '@/features/wallets/WalletMembers'
import { useWallet } from '@/hooks/useWallet'
import type { WalletWithRole } from '@/types'

export function WalletList() {
  const { wallets, currentWallet, loading, setCurrentWalletId, deleteWallet } = useWallet()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<WalletWithRole | null>(null)
  const [managingMembers, setManagingMembers] = useState<WalletWithRole | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<WalletWithRole | null>(null)

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading wallets…</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Wallets</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} strokeWidth={2} />
          New wallet
        </Button>
      </div>

      {wallets.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-muted">
            You don't have any wallets yet. Create one for your personal spending, or a shared one for a household
            or trip.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((w) => {
            const isActive = w.id === currentWallet?.id
            return (
              <li
                key={w.id}
                className={`rounded-[var(--radius-card)] border bg-surface p-4 transition-colors ${
                  isActive ? 'border-pine' : 'border-line'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{w.name}</p>
                    {w.description ? (
                      <p className="mt-0.5 truncate text-sm text-ink-muted">{w.description}</p>
                    ) : null}
                  </div>
                  {isActive ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-pine-soft px-2 py-0.5 text-xs font-medium text-pine">
                      <Check size={12} strokeWidth={2.5} />
                      Active
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Users size={13} strokeWidth={2} />
                  {w.memberCount} {w.memberCount === 1 ? 'member' : 'members'} · {w.role}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!isActive ? (
                    <Button variant="secondary" onClick={() => setCurrentWalletId(w.id)} className="text-xs">
                      Switch to
                    </Button>
                  ) : null}
                  <Button variant="ghost" onClick={() => setManagingMembers(w)} className="text-xs">
                    <Users size={14} strokeWidth={2} />
                    Members
                  </Button>
                  {w.role === 'owner' ? (
                    <>
                      <Button variant="ghost" onClick={() => setEditing(w)} className="text-xs">
                        <Pencil size={14} strokeWidth={2} />
                        Rename
                      </Button>
                      <Button variant="ghost" onClick={() => setConfirmDelete(w)} className="text-xs text-brick hover:bg-brick-soft">
                        <Trash2 size={14} strokeWidth={2} />
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {creating ? (
        <Modal title="New wallet" onClose={() => setCreating(false)}>
          <WalletForm onDone={() => setCreating(false)} />
        </Modal>
      ) : null}

      {editing ? (
        <Modal title="Rename wallet" onClose={() => setEditing(null)}>
          <WalletForm wallet={editing} onDone={() => setEditing(null)} />
        </Modal>
      ) : null}

      {managingMembers ? (
        <Modal title={`${managingMembers.name} · Members`} onClose={() => setManagingMembers(null)}>
          <WalletMembers wallet={managingMembers} />
        </Modal>
      ) : null}

      {confirmDelete ? (
        <Modal title="Delete wallet?" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-ink-muted">
            This permanently deletes <span className="font-medium text-ink">{confirmDelete.name}</span> and every
            transaction, budget, and goal in it. This can't be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              className="bg-brick hover:bg-brick/90"
              onClick={async () => {
                await deleteWallet(confirmDelete.id)
                setConfirmDelete(null)
              }}
            >
              Delete wallet
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}