// Form checks that match the backend and database limits, so input
// that passes here is not rejected by the server.

function checkText(errors, field, value, label, maxLength, required = true) {
  const text = (value ?? '').trim()

  if (required && !text) {
    errors[field] = `${label} is required.`
  } else if (text.length > maxLength) {
    errors[field] = `${label} must be ${maxLength} characters or fewer.`
  }
}

// Limits from the devices table in backend/schema.sql.
export function validateDevice(values) {
  const errors = {}

  checkText(errors, 'name', values.name, 'Device name', 100)
  checkText(errors, 'device_type', values.device_type, 'Device type', 50)
  checkText(errors, 'os_name', values.os_name, 'Operating system', 100)
  checkText(errors, 'os_version', values.os_version, 'Version', 100)

  return errors
}

// Limits from the software table and the software API checks.
export function validateSoftware(values) {
  const errors = {}

  checkText(errors, 'name', values.name, 'Software name', 150)
  checkText(errors, 'version', values.version, 'Version', 100)
  checkText(errors, 'vendor', values.vendor, 'Vendor', 150, false)

  return errors
}
