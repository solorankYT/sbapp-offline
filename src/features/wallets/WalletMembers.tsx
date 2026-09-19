import { useEffect, useState, type FormEvent } from 'react'
import { UserMinus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import type { WalletMemberWithProfile, WalletWithRole } from '@/types'

export function WalletMembers({ wallet }: { wallet: WalletWithRole }) {
  const [members, setMembers] = useState<WalletMemberWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)

  const isOwner = wallet.role === 'owner'

  async function loadMembers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('wallet_members')
      .select('*, profile:profiles(id, full_name, email)')
      .eq('wallet_id', wallet.id)
      .order('joined_at', { ascending: true })

    if (!error) setMembers((data ?? []) as unknown as WalletMemberWithProfile[])
    setLoading(false)
  }

  useEffect(() => {
    loadMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.id])

  async function handleInvite(event: FormEvent) {
    event.preventDefault()
    setInviteError(null)
    setIsInviting(true)

    const { error } = await supabase.rpc('invite_wallet_member', {
      target_wallet_id: wallet.id,
      member_email: inviteEmail.trim(),
    })

    setIsInviting(false)

    if (error) {
      setInviteError(error.message)
      return
    }

    setInviteEmail('')
    await loadMembers()
  }

  async function handleRemove(memberId: string) {
    await supabase.from('wallet_members').delete().eq('id', memberId)
    await loadMembers()
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-ink">Members</h3>

      {loading ? (
        <p className="mt-2 text-sm text-ink-muted">Loading…</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-[var(--radius-card)] border border-line bg-surface px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{m.profile?.full_name || m.profile?.email}</p>
                <p className="text-xs capitalize text-ink-muted">{m.role}</p>
              </div>
              {isOwner && m.role !== 'owner' ? (
                <button
                  type="button"
                  onClick={() => handleRemove(m.id)}
                  aria-label="Remove member"
                  className="text-ink-muted transition-colors hover:text-brick"
                >
                  <UserMinus size={16} strokeWidth={2} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {isOwner ? (
        <form onSubmit={handleInvite} className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <Field
              label="Invite by email"
              type="email"
              placeholder="name@example.com"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" isLoading={isInviting}>
            Invite
          </Button>
        </form>
      ) : null}
      {inviteError ? (
        <p className="mt-2 text-sm text-brick" role="alert">
          {inviteError}
        </p>
      ) : null}
    </div>
  )
}