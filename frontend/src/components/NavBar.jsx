import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext.js'

function NavBar() {
  const navigate = useNavigate()
  const { user, checking, signOut } = useAuth()

  async function handleLogout() {
    try {
      await signOut()
      navigate('/login', { state: { notice: 'You have been logged out.' } })
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-logo">CB</span>
        Cyber Buddy
      </Link>
      <nav className="navbar-links">
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/devices/new">Add device</NavLink>
      </nav>
      {!checking && (
        <div className="navbar-account">
          {user ? (
            <>
              <span className="muted">Hi, {user.display_name}</span>
              <button type="button" className="button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="button">
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  )
}

export default NavBar
