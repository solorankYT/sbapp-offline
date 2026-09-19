import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { WalletProvider } from '@/context/WalletContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { GuestRoute } from '@/components/layout/GuestRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { WalletsPage } from '@/pages/WalletsPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { GoalsPage } from '@/pages/GoalsPage'
import { AccountsPage } from '@/pages/AccountsPage'
import { DebtsPage } from '@/pages/DebtsPage';
import { BillsPage } from '@/pages/BillsPage'



export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route
              element={
                <WalletProvider>
                  <AppLayout />
                </WalletProvider>
              }
            >
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/bills" element={<BillsPage />} />
              <Route path="/" element={<DashboardPage />} />
              <Route path="/wallets" element={<WalletsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/settings" element={<SettingsPage />} /> 
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/debts" element={<DebtsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}