import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, login, logout, register, SESSION_ENDED_EVENT } from '../api.js'
import { AuthContext } from './authContext.js'

// Keeps track of who is logged in, using the backend session cookie.
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true

    getCurrentUser()
      .then(current => {
        if (active) setUser(current)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setChecking(false)
      })

    return () => {
      active = false
    }
  }, [])

  // A protected request came back 401: forget the user so RequireAuth
  // redirects to the login page.
  useEffect(() => {
    function handleSessionEnded() {
      setUser(null)
    }

    window.addEventListener(SESSION_ENDED_EVENT, handleSessionEnded)
    return () => window.removeEventListener(SESSION_ENDED_EVENT, handleSessionEnded)
  }, [])

  const signIn = useCallback(async credentials => {
    const loggedIn = await login(credentials)
    setUser(loggedIn)
    return loggedIn
  }, [])

  // Creating an account does not start a session, so log in right after.
  const signUp = useCallback(async ({ displayName, email, password }) => {
    await register({ displayName, email, password })
    const loggedIn = await login({ email, password })
    setUser(loggedIn)
    return loggedIn
  }, [])

  const signOut = useCallback(async () => {
    await logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, checking, signIn, signUp, signOut }),
    [user, checking, signIn, signUp, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
