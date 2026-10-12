import { Link } from 'react-router-dom'
import RiskBadge from './RiskBadge.jsx'

function SoftwareTable({ deviceId, software, onRemove }) {
  if (software.length === 0) {
    return <p className="muted">No programs added for this device yet.</p>
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Version</th>
          <th>Status</th>
          <th>Risk</th>
          <th>
            <span className="visually-hidden">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {software.map(item => (
          <tr key={item.id}>
            <td>
              {item.name}
              {!item.verified && <span className="muted"> (unverified)</span>}
            </td>
            <td>{item.version}</td>
            <td>{item.verified ? 'Checked' : "Can't check"}</td>
            <td>
              <RiskBadge score={item.riskScore} level={item.riskLevel} />
            </td>
            <td className="row-actions">
              <Link to={`/devices/${deviceId}/software/${item.id}/edit`}>Edit</Link>
              <button
                type="button"
                className="link-button"
                onClick={() => onRemove(item)}
              >
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default SoftwareTable
