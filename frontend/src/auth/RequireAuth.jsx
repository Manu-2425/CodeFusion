import { Navigate, useLocation } from 'react-router-dom'
import StatusMessage from '../components/StatusMessage.jsx'
import { useAuth } from './authContext.js'

// Pages inside this need a logged-in user. Anyone else is sent to the
// login page, which brings them back here afterwards.
function RequireAuth({ children }) {
  const { user, checking } = useAuth()
  const location = useLocation()

  if (checking) {
    return <StatusMessage title="Checking your session…" />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default RequireAuth
