import { sourceLabel } from '../source.js'

// Small label for devices and software added automatically (DR13).
function SourceBadge({ source, short = false }) {
  const label = sourceLabel(source)
  if (!label) return null

  return (
    <span className="source-badge" title={label}>
      {short ? 'Detected' : label}
    </span>
  )
}

export default SourceBadge
