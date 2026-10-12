import RiskBadge from './RiskBadge.jsx'

function SoftwareTable({ software }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Version</th>
          <th>Status</th>
          <th>Risk</th>
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
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default SoftwareTable
