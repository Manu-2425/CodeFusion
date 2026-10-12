import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createDevice, getDevices, updateDevice } from '../api.js'
import FormField from '../components/FormField.jsx'
import StatusMessage from '../components/StatusMessage.jsx'
import { OPERATING_SYSTEMS, versionHelpFor } from '../deviceOptions.js'
import { validateDevice } from '../validation.js'

const DEVICE_TYPES = ['Laptop/Desktop', 'Phone', 'Tablet']

const EMPTY_DEVICE = {
  name: '',
  device_type: DEVICE_TYPES[0],
  os_name: '',
  os_version: ''
}

// Used for both adding (/devices/new) and editing (/devices/:deviceId/edit).
function DeviceForm() {
  const { deviceId } = useParams()
  const isEdit = Boolean(deviceId)
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_DEVICE)
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState(null)

  useEffect(() => {
    if (!isEdit) return

    let active = true

    getDevices()
      .then(devices => {
        if (!active) return

        const device = devices.find(item => item.device_id === deviceId)

        if (!device) {
          setLoadError('This device may have been removed.')
        } else {
          setValues({
            name: device.name,
            device_type: device.device_type,
            os_name: device.os_name,
            os_version: device.os_version
          })
        }

        setLoading(false)
      })
      .catch(err => {
        if (!active) return
        setLoadError(err.message)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [deviceId, isEdit])

  function setField(field, value) {
    setValues(current => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const found = validateDevice(values)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      return
    }

    setSaving(true)
    setServerError(null)

    try {
      const fields = {
        name: values.name.trim(),
        device_type: values.device_type,
        os_name: values.os_name,
        os_version: values.os_version.trim()
      }
      const device = isEdit
        ? await updateDevice(deviceId, fields)
        : await createDevice(fields)

      navigate(`/devices/${device.device_id}`, {
        state: { notice: isEdit ? 'Device updated.' : 'Device added.' }
      })
    } catch (err) {
      setServerError(err.message)
      setSaving(false)
    }
  }

  const cancelPath = isEdit ? `/devices/${deviceId}` : '/'

  // Keep a saved type or OS selectable even if it is not in the lists.
  const deviceTypes = DEVICE_TYPES.includes(values.device_type)
    ? DEVICE_TYPES
    : [...DEVICE_TYPES, values.device_type]
  const osNames = OPERATING_SYSTEMS.map(os => os.name)

  if (!osNames.includes(values.os_name) && values.os_name) {
    osNames.push(values.os_name)
  }

  if (loading) {
    return <StatusMessage title="Loading device…" />
  }

  if (loadError) {
    return (
      <StatusMessage title="Couldn't load this device" tone="error">
        {loadError}
      </StatusMessage>
    )
  }

  return (
    <>
      <p className="breadcrumb">
        <Link to="/">Dashboard</Link> › {isEdit ? 'Edit device' : 'Add device'}
      </p>
      <h1>{isEdit ? 'Edit device' : 'Add a device'}</h1>
      <p className="muted">
        {isEdit
          ? 'Correct the details of this device.'
          : 'Tell us about a computer, phone, or tablet you use.'}
      </p>

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <FormField id="name" error={errors.name} label="Device name">
          <input
            id="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            value={values.name}
            onChange={event => setField('name', event.target.value)}
            placeholder="e.g. My Laptop"
            maxLength={100}
          />
        </FormField>

        <div className="field">
          <span className="field-label" id="device-type-label">Device type</span>
          <div className="choice-buttons" role="group" aria-labelledby="device-type-label">
            {deviceTypes.map(type => (
              <button
                key={type}
                type="button"
                className={`choice-button${values.device_type === type ? ' selected' : ''}`}
                aria-pressed={values.device_type === type}
                onClick={() => setField('device_type', type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <FormField id="os_name" error={errors.os_name} label="Operating system">
          <select
            id="os_name"
            aria-invalid={Boolean(errors.os_name)}
            aria-describedby={errors.os_name ? 'os_name-error' : undefined}
            value={values.os_name}
            onChange={event => setField('os_name', event.target.value)}
          >
            <option value="">Choose an operating system</option>
            {osNames.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="os_version"
          error={errors.os_version}
          label="Operating system version"
          hint={values.os_name && `Not sure? ${versionHelpFor(values.os_name)}`}
        >
          <input
            id="os_version"
            aria-invalid={Boolean(errors.os_version)}
            aria-describedby={errors.os_version ? 'os_version-error' : undefined}
            value={values.os_version}
            onChange={event => setField('os_version', event.target.value)}
            placeholder="e.g. 11"
            maxLength={100}
          />
        </FormField>

        {serverError && <p className="field-error">{serverError}</p>}

        <div className="form-actions">
          <Link to={cancelPath} className="button">Cancel</Link>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save device'}
          </button>
        </div>
      </form>
    </>
  )
}

export default DeviceForm
