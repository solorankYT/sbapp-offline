import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm } from '@/features/transactions/TransactionForm'
import { useWallet } from '@/hooks/useWallet'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'

export function AppLayout() {
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const { currentWallet } = useWallet()
  const { categories } = useCategories(currentWallet?.id)
  const { accounts } = useAccounts(currentWallet?.id)
  const { addTransaction } = useTransactions(currentWallet?.id)

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-5 pb-28 pt-6 lg:px-10 lg:pb-10 lg:pt-8">
        <Outlet />
      </main>
      <MobileNav onAddClick={() => setQuickAddOpen(true)} />

      {quickAddOpen && currentWallet ? (
        <Modal title="Add transaction" onClose={() => setQuickAddOpen(false)}>
          <TransactionForm
            categories={categories}
            accounts={accounts}
            onSubmit={addTransaction}
            onDone={() => setQuickAddOpen(false)}
          />
        </Modal>
      ) : null}
    </div>
  )
}