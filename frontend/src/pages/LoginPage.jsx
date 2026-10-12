import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/authContext.js'
import FormField from '../components/FormField.jsx'
import { validateLogin, validateSignUp } from '../validation.js'

const EMPTY_FORM = { displayName: '', email: '', password: '', confirmPassword: '' }

// Log in and Sign up share one page (/login and /login?mode=signup).
function LoginPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isSignUp = searchParams.get('mode') === 'signup'
  const { signIn, signUp } = useAuth()
  const [values, setValues] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)

  function setField(field, value) {
    setValues(current => ({ ...current, [field]: value }))
  }

  function switchMode(signUpMode) {
    setSearchParams(signUpMode ? { mode: 'signup' } : {})
    setErrors({})
    setServerError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const found = isSignUp ? validateSignUp(values) : validateLogin(values)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      return
    }

    setSubmitting(true)
    setServerError(null)

    try {
      const credentials = { email: values.email.trim(), password: values.password }
      const user = isSignUp
        ? await signUp({ ...credentials, displayName: values.displayName.trim() })
        : await signIn(credentials)
      const notice = isSignUp
        ? `Welcome to Cyber Buddy, ${user.display_name}.`
        : `Welcome back, ${user.display_name}.`

      navigate('/', { state: { notice } })
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

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            className={`auth-tab${isSignUp ? '' : ' selected'}`}
            onClick={() => switchMode(false)}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            className={`auth-tab${isSignUp ? ' selected' : ''}`}
            onClick={() => switchMode(true)}
          >
            Sign up
          </button>
        </div>

        <button type="button" className="button auth-google" disabled>
          Continue with Google (coming soon)
        </button>
        <p className="auth-divider">or use email</p>

        <form onSubmit={handleSubmit} noValidate>
          {isSignUp && (
            <FormField id="display-name" error={errors.displayName} label="Your name">
              <input
                id="display-name"
                aria-invalid={Boolean(errors.displayName)}
                aria-describedby={errors.displayName ? 'display-name-error' : undefined}
                autoComplete="name"
                value={values.displayName}
                onChange={event => setField('displayName', event.target.value)}
              />
            </FormField>
          )}

          <FormField id="email" error={errors.email} label="Email">
            <input
              id="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={event => setField('email', event.target.value)}
              placeholder="you@example.com"
            />
          </FormField>

          <FormField
            id="password"
            error={errors.password}
            label="Password"
            hint={isSignUp ? 'At least 12 characters.' : undefined}
          >
            <input
              id="password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={values.password}
              onChange={event => setField('password', event.target.value)}
            />
          </FormField>

          {isSignUp && (
            <FormField
              id="confirm-password"
              error={errors.confirmPassword}
              label="Confirm password"
            >
              <input
                id="confirm-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                type="password"
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={event => setField('confirmPassword', event.target.value)}
              />
            </FormField>
          )}

          {serverError && <p className="field-error">{serverError}</p>}

          <button type="submit" className="button button-primary auth-submit" disabled={submitting}>
            {submitting
              ? isSignUp ? 'Creating account…' : 'Logging in…'
              : isSignUp ? 'Create account' : 'Log in'}
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
