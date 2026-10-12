import { useLocation, useNavigate } from 'react-router-dom'

// Shows a one-time success message passed through navigation state,
// e.g. navigate(path, { state: { notice: 'Device added' } }).
function Notice() {
  const location = useLocation()
  const navigate = useNavigate()
  const notice = location.state?.notice

  if (!notice) return null

  function dismiss() {
    navigate(location.pathname, { replace: true, state: null })
  }

  return (
    <div className="notice" role="status">
      <span>{notice}</span>
      <button type="button" className="notice-close" onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}

export default Notice
