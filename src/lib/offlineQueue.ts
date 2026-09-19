import type { NewTransaction } from '@/hooks/useTransactions'

export interface QueuedTransaction {
  localId: string
  walletId: string
  input: NewTransaction
  queuedAt: string
}

const QUEUE_KEY = 'ledger:pending-transactions'

export function getQueue(): QueuedTransaction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as QueuedTransaction[]) : []
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedTransaction[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // Non-fatal.
  }
}

export function enqueueTransaction(walletId: string, input: NewTransaction): QueuedTransaction {
  const item: QueuedTransaction = {
    localId: crypto.randomUUID(),
    walletId,
    input,
    queuedAt: new Date().toISOString(),
  }
  saveQueue([...getQueue(), item])
  return item
}

export function removeFromQueue(localId: string) {
  saveQueue(getQueue().filter((item) => item.localId !== localId))
}

export function getQueueForWallet(walletId: string): QueuedTransaction[] {
  return getQueue().filter((item) => item.walletId === walletId)
}