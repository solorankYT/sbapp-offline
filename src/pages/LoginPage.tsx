import { LoginForm } from '@/features/auth/LoginForm'
import { AuthPage } from '@/pages/AuthPage'

export function LoginPage() {
  return (
    <AuthPage title="Welcome back" subtitle="Log in to see where things stand.">
      <LoginForm />
    </AuthPage>
  )
}