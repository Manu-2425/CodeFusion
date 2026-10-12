import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext.js'
import FormField from '../components/FormField.jsx'

const EMPTY_FORM = { email: '', password: '' }

function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [values, setValues] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)

  function setField(field, value) {
    setValues(current => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setServerError(null)

    try {
      const user = await signIn({
        email: values.email.trim(),
        password: values.password
      })
      navigate('/', { state: { notice: `Welcome back, ${user.display_name}.` } })
    } catch (err) {
      setServerError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="card auth-card">
        <p className="auth-brand">
          <span className="navbar-logo">CB</span> Cyber Buddy
        </p>
        <p className="muted auth-tagline">See how safe your devices are, in plain language.</p>

        <h1>Log in</h1>

        <button type="button" className="button auth-google" disabled>
          Continue with Google (coming soon)
        </button>
        <p className="auth-divider">or use email</p>

        <form onSubmit={handleSubmit}>
          <FormField id="email" label="Email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={event => setField('email', event.target.value)}
              placeholder="you@example.com"
            />
          </FormField>

          <FormField id="password" label="Password">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={event => setField('password', event.target.value)}
            />
          </FormField>

          {serverError && <p className="field-error">{serverError}</p>}

          <button type="submit" className="button button-primary auth-submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth-trust">
          🔒 Cyber Buddy never asks for passwords to your other accounts.
        </p>
      </section>
    </div>
  )
}

export default LoginPage
