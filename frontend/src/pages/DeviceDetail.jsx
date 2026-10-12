import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteDevice,
  deleteSoftware,
  getDevices,
  getRiskScore,
  getSoftware
} from '../api.js'
import RiskBadge from '../components/RiskBadge.jsx'
import SoftwareTable from '../components/SoftwareTable.jsx'
import StatusMessage from '../components/StatusMessage.jsx'
import { formatScore, riskClass } from '../risk.js'

// Software versions come from /api/devices/:id/software and
// scores from /api/risk-score, matched by software ID.
function mergeSoftware(software, scoredDevice) {
  const scores = new Map(
    (scoredDevice?.software ?? []).map(item => [item.id, item])
  )

  return software.map(item => {
    const scored = scores.get(item.software_id)

    return {
      id: item.software_id,
      name: item.name,
      version: item.version,
      verified: item.match_status === 'verified',
      riskScore: scored ? scored.riskScore : null,
      riskLevel: scored ? scored.riskLevel : "Can't check"
    }
  })
}

function DeviceDetail() {
  const { deviceId } = useParams()
  const navigate = useNavigate()
  const [device, setDevice] = useState(null)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setDevice(null)
    setError(null)

    Promise.all([getDevices(), getRiskScore(), getSoftware(deviceId)])
      .then(([devices, report, software]) => {
        if (!active) return

        const info = devices.find(item => item.device_id === deviceId)
        const scored = report.devices.find(item => item.id === deviceId)

        if (!info) {
          setError('Device not found')
          return
        }

        setDevice({
          name: info.name,
          type: info.device_type,
          os: `${info.os_name} ${info.os_version}`,
          riskScore: scored ? scored.riskScore : null,
          riskLevel: scored ? scored.riskLevel : "Can't check",
          osRisk: scored ? scored.os : { riskScore: null, riskLevel: "Can't check" },
          software: mergeSoftware(software, scored)
        })
      })
      .catch(err => {
        if (active) setError(err.message)
      })

    return () => {
      active = false
    }
  }, [deviceId, reloadKey])

  // Removed devices are soft-deleted by the backend and purged later.
  async function handleRemoveDevice() {
    const confirmed = window.confirm(
      `Remove "${device.name}" and its software from your inventory?`
    )

    if (!confirmed) return

    try {
      await deleteDevice(deviceId)
      navigate('/')
    } catch (err) {
      setActionError(err.message)
    }
  }

  // Reloads the page data so the device and overall scores update too.
  async function handleRemoveSoftware(item) {
    const confirmed = window.confirm(`Remove "${item.name}" from this device?`)

    if (!confirmed) return

    try {
      await deleteSoftware(item.id)
      setActionError(null)
      setReloadKey(key => key + 1)
    } catch (err) {
      setActionError(err.message)
    }
  }

  return (
    <>
      <p className="breadcrumb">
        <Link to="/">Dashboard</Link> › Device
      </p>
      {error && (
        <StatusMessage title="Couldn't load this device" tone="error">
          {error === 'Device not found' || error === 'Invalid device ID'
            ? 'This device may have been removed.'
            : error}
        </StatusMessage>
      )}
      {!error && !device && <StatusMessage title="Loading device…" />}
      {device && (
        <>
          <div className="page-header">
            <h1>
              {device.name} <span className="muted heading-note">{device.type}</span>
            </h1>
            <div className="page-actions">
              <Link to={`/devices/${deviceId}/edit`} className="button">
                Edit
              </Link>
              <button
                type="button"
                className="button button-danger"
                onClick={handleRemoveDevice}
              >
                Remove device
              </button>
            </div>
          </div>
          {actionError && <p className="field-error">{actionError}</p>}
          <div className="dashboard-grid">
            <section className="card score-card">
              <h2>Device risk</h2>
              <p className={`device-score ${riskClass(device.riskLevel)}`}>
                {formatScore(device.riskScore)}
              </p>
              <RiskBadge level={device.riskLevel} />
              <p className="muted score-note">
                Based on the operating system and the programs installed on
                this device.
              </p>
            </section>

            <section className="card">
              <h2>Operating system</h2>
              <p className="os-row">
                <span>{device.os}</span>
                <RiskBadge
                  score={device.osRisk.riskScore}
                  level={device.osRisk.riskLevel}
                />
              </p>

              <div className="section-header">
                <h2>Installed software ({device.software.length})</h2>
                <Link to={`/devices/${deviceId}/software/new`} className="button">
                  + Add software
                </Link>
              </div>
              <SoftwareTable
                deviceId={deviceId}
                software={device.software}
                onRemove={handleRemoveSoftware}
              />
            </section>
          </div>
        </>
      )}
    </>
  )
}

export default DeviceDetail
