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

// Same email pattern as POST /api/auth/register.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLogin(values) {
  const errors = {}

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  }

  return errors
}

// Password rules match the backend: at least 12 characters and at most
// 72 bytes, the most bcrypt can use.
export function validateSignUp(values) {
  const errors = {}
  const email = values.email.trim()

  checkText(errors, 'displayName', values.displayName, 'Your name', 100)

  if (!email) {
    errors.email = 'Email is required.'
  } else if (email.length > 255 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address, like you@example.com.'
  }

  if (values.password.length < 12) {
    errors.password = 'Password must be at least 12 characters.'
  } else if (new TextEncoder().encode(values.password).length > 72) {
    errors.password = 'Password is too long. Use 72 bytes or fewer.'
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}
