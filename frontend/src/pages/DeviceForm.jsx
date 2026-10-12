import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createDevice } from '../api.js'
import FormField from '../components/FormField.jsx'

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
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState(null)

  function setField(field, value) {
    setValues(current => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setServerError(null)

    try {
      const device = await createDevice(values)
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

      <form className="card form-card" onSubmit={handleSubmit}>
        <FormField id="name" label="Device name">
          <input
            id="name"
            value={values.name}
            onChange={event => setField('name', event.target.value)}
            placeholder="e.g. My Laptop"
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

        <FormField id="os_name" label="Operating system">
          <input
            id="os_name"
            value={values.os_name}
            onChange={event => setField('os_name', event.target.value)}
            placeholder="e.g. Windows"
          />
        </FormField>

        <FormField id="os_version" label="Operating system version">
          <input
            id="os_version"
            value={values.os_version}
            onChange={event => setField('os_version', event.target.value)}
            placeholder="e.g. 11"
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
