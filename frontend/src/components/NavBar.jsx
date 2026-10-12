import { Link, NavLink } from 'react-router-dom'

function NavBar() {
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
      </nav>
    </header>
  )
}

export default NavBar
