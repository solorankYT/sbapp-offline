import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { useAuth } from '@/hooks/useAuth'

export function LoginForm() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: signInError } = await signIn(email, password)

    setIsSubmitting(false)

    if (signInError) {
      setError(signInError)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
        autoComplete="current-password"
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
        Log in
      </Button>
      <p className="text-center text-sm text-ink-muted">
        New here?{' '}
        <Link to="/signup" className="font-medium text-pine hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}