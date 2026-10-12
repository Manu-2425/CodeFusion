import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createDevice } from '../api.js'
import FormField from '../components/FormField.jsx'
import { OPERATING_SYSTEMS, versionHelpFor } from '../deviceOptions.js'
import { validateDevice } from '../validation.js'

const DEVICE_TYPES = ['Laptop/Desktop', 'Phone', 'Tablet']

const EMPTY_DEVICE = {
  name: '',
  device_type: DEVICE_TYPES[0],
  os_name: '',
  os_version: ''
}

function DeviceForm() {
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_DEVICE)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState(null)

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
      const device = await createDevice({
        name: values.name.trim(),
        device_type: values.device_type,
        os_name: values.os_name,
        os_version: values.os_version.trim()
      })
      navigate(`/devices/${device.device_id}`)
    } catch (err) {
      setServerError(err.message)
      setSaving(false)
    }
  }

  return (
    <>
      <p className="breadcrumb">
        <Link to="/">Dashboard</Link> › Add device
      </p>
      <h1>Add a device</h1>
      <p className="muted">Tell us about a computer, phone, or tablet you use.</p>

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
            {DEVICE_TYPES.map(type => (
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
            {OPERATING_SYSTEMS.map(os => (
              <option key={os.name} value={os.name}>
                {os.name}
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
          <Link to="/" className="button">Cancel</Link>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save device'}
          </button>
        </div>
      </form>
    </>
  )
}

export default DeviceForm
