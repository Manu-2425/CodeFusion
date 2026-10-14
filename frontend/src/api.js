// All calls to the Cyber Buddy backend go through this file.
// Requests use relative /api paths; the Vite dev server forwards them
// to the backend set by BACKEND_URL in frontend/.env.

// Fired when the backend says the session is gone (expired or logged out
// in another tab). AuthProvider listens for it and sends the user to log in.
export const SESSION_ENDED_EVENT = 'cyberbuddy:session-ended'

async function request(path, { method = 'GET', body } = {}) {
  let response

  try {
    response = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    })
  } catch {
    throw new Error("Can't reach the server. Is the backend running?")
  }

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.success) {
    const error = new Error(data?.message || `Request failed (${response.status})`)
    error.status = response.status

    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event(SESSION_ENDED_EVENT))
    }

    throw error
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

// Fields: name, version, vendor (optional).
export async function createSoftware(deviceId, fields) {
  const data = await request(`/api/devices/${encodeURIComponent(deviceId)}/software`, {
    method: 'POST',
    body: fields
  })
  return data.software
}

// Editing resets the program to unverified until it is checked again.
export async function updateSoftware(softwareId, fields) {
  const data = await request(`/api/software/${encodeURIComponent(softwareId)}`, {
    method: 'PUT',
    body: fields
  })
  return data.software
}

export function deleteSoftware(softwareId) {
  return request(`/api/software/${encodeURIComponent(softwareId)}`, { method: 'DELETE' })
}

// Account and session (cookie-based; see backend /api/auth routes).

export async function register({ displayName, email, password }) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: { display_name: displayName, email, password }
  })
  return data.user
}

export async function login({ email, password }) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  })
  return data.user
}

// Returns the logged-in user, or null when nobody is logged in.
export async function getCurrentUser() {
  try {
    const data = await request('/api/auth/me')
    return data.user
  } catch (err) {
    if (err.status === 401) return null
    throw err
  }
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST' })
}
