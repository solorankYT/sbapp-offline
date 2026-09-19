import { SignupForm } from '@/features/auth/SignupForm'
import { AuthPage } from '@/pages/AuthPage'

export function SignupPage() {
  return (
    <AuthPage title="Create your account" subtitle="Takes a few seconds to get started.">
      <SignupForm />
    </AuthPage>
  )
}

//