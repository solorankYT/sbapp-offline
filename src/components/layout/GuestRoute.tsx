import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function GuestRoute() {
  const { session, loading } = useAuth()

  if (loading) return null

  if (session) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}