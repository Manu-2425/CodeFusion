import { useEffect, useState } from 'react'
import { getDevices, getRiskScore } from '../api.js'
import InventoryTable from '../components/InventoryTable.jsx'
import RiskScoreCard from '../components/RiskScoreCard.jsx'

// Device details come from /api/devices and scores from /api/risk-score.
// risk_score in /api/devices is not calculated yet, so it is not used.
function mergeInventory(devices, report) {
  const scores = new Map(report.devices.map(device => [device.id, device]))

  return devices.map(device => {
    const scored = scores.get(device.device_id)

    return {
      id: device.device_id,
      name: device.name,
      type: device.device_type,
      os: `${device.os_name} ${device.os_version}`,
      programCount: scored ? scored.software.length : 0,
      riskScore: scored ? scored.riskScore : null,
      riskLevel: scored ? scored.riskLevel : "Can't check"
    }
  })
}

function Dashboard() {
  const [report, setReport] = useState(null)
  const [inventory, setInventory] = useState([])

  useEffect(() => {
    Promise.all([getRiskScore(), getDevices()]).then(([riskReport, devices]) => {
      setReport(riskReport)
      setInventory(mergeInventory(devices, riskReport))
    })
  }, [])

  return (
    <>
      <h1>Dashboard</h1>
      {report && (
        <div className="dashboard-grid">
          <RiskScoreCard score={report.riskScore} level={report.riskLevel} />
          <InventoryTable devices={inventory} />
        </div>
      )}
    </>
  )
}

export default Dashboard
