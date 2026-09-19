import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { useAuth } from '@/hooks/useAuth'

export function SignupForm() {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: signUpError } = await signUp(email, password, fullName)

    setIsSubmitting(false)

    if (signUpError) {
      setError(signUpError)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm text-ink">
          Check <span className="font-medium">{email}</span> for a confirmation link to finish setting up your
          account.
        </p>
        <Link to="/login" className="text-sm font-medium text-pine hover:underline">
          Back to log in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field
        label="Full name"
        type="text"
        autoComplete="name"
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <Field
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={6}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error ? (
        <p className="rounded-[var(--radius-card)] bg-brick-soft px-3.5 py-2.5 text-sm text-brick" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full">
        Create account
      </Button>
      <p className="text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-pine hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}