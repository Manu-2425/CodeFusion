import { Link } from 'react-router-dom'
import RiskBadge from './RiskBadge.jsx'

function InventoryTable({ devices }) {
  return (
    <section className="card">
      <div className="section-header">
        <h2>Your inventory</h2>
        <Link to="/devices/new" className="button">+ Add device</Link>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Device</th>
            <th>Type</th>
            <th>Operating system</th>
            <th>Programs</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          {devices.map(device => (
            <tr key={device.id}>
              <td>
                <Link to={`/devices/${device.id}`}>{device.name}</Link>
              </td>
              <td>{device.type}</td>
              <td>{device.os}</td>
              <td>{device.programCount}</td>
              <td>
                <RiskBadge score={device.riskScore} level={device.riskLevel} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default InventoryTable
