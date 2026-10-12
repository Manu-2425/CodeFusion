import { Link, useParams } from 'react-router-dom'

function DeviceDetail() {
  const { deviceId } = useParams()

  return (
    <>
      <p className="breadcrumb">
        <Link to="/">Dashboard</Link> › Device
      </p>
      <h1>Device</h1>
      <p className="muted">Details for device {deviceId} will appear here.</p>
    </>
  )
}

export default DeviceDetail
