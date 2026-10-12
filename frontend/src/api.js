// All calls to the Cyber Buddy backend go through this file.
// The backend address comes from VITE_API_URL in frontend/.env.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

async function request(path, { method = 'GET', body } = {}) {
  let response

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    })
  } catch {
    throw new Error("Can't reach the server. Is the backend running?")
  }

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || `Request failed (${response.status})`)
  }

  return data
}

// Overall, inventory, per-device, OS and software scores.
export function getRiskScore() {
  return request('/api/risk-score')
}

// Devices with type, OS name and OS version.
export async function getDevices() {
  const data = await request('/api/devices')
  return data.devices
}

// Fields: name, device_type, os_name, os_version.
export async function createDevice(fields) {
  const data = await request('/api/devices', { method: 'POST', body: fields })
  return data.device
}

export async function updateDevice(deviceId, fields) {
  const data = await request(`/api/devices/${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    body: fields
  })
  return data.device
}

export function deleteDevice(deviceId) {
  return request(`/api/devices/${encodeURIComponent(deviceId)}`, { method: 'DELETE' })
}

// Installed software for one device, with version and match status.
export async function getSoftware(deviceId) {
  const data = await request(`/api/devices/${encodeURIComponent(deviceId)}/software`)
  return data.software
}
