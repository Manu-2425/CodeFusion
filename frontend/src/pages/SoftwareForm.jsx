import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createSoftware } from '../api.js'
import FormField from '../components/FormField.jsx'
import { validateSoftware } from '../validation.js'

const EMPTY_SOFTWARE = { name: '', version: '', vendor: '' }

function SoftwareForm() {
  const { deviceId } = useParams()
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_SOFTWARE)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState(null)

  const devicePath = `/devices/${deviceId}`

  function setField(field, value) {
    setValues(current => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const found = validateSoftware(values)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      return
    }

    setSaving(true)
    setServerError(null)

    try {
      await createSoftware(deviceId, {
        name: values.name.trim(),
        version: values.version.trim(),
        vendor: values.vendor.trim() || undefined
      })
      navigate(devicePath)
    } catch (err) {
      setServerError(err.message)
      setSaving(false)
    }
  }

  return (
    <>
      <p className="breadcrumb">
        <Link to="/">Dashboard</Link> › <Link to={devicePath}>Device</Link> › Add software
      </p>
      <h1>Add software</h1>
      <p className="muted">Add a program installed on this device.</p>

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <FormField id="software-name" error={errors.name} label="Software name">
          <input
            id="software-name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'software-name-error' : undefined}
            maxLength={150}
            value={values.name}
            onChange={event => setField('name', event.target.value)}
            placeholder="e.g. Google Chrome"
          />
        </FormField>

        <FormField
          id="software-version"
          error={errors.version}
          label="Version"
          hint="Tip: in most apps, open Help → About to see the version."
        >
          <input
            id="software-version"
            aria-invalid={Boolean(errors.version)}
            aria-describedby={errors.version ? 'software-version-error' : undefined}
            maxLength={100}
            value={values.version}
            onChange={event => setField('version', event.target.value)}
            placeholder="e.g. 118.0"
          />
        </FormField>

        <FormField id="software-vendor" error={errors.vendor} label="Vendor (optional)">
          <input
            id="software-vendor"
            aria-invalid={Boolean(errors.vendor)}
            aria-describedby={errors.vendor ? 'software-vendor-error' : undefined}
            maxLength={150}
            value={values.vendor}
            onChange={event => setField('vendor', event.target.value)}
            placeholder="e.g. Google"
          />
        </FormField>

        <p className="form-note">
          New programs are saved as <strong>unverified</strong> and show as
          &ldquo;Can&apos;t check&rdquo; until they can be matched to
          vulnerability data.
        </p>

        {serverError && <p className="field-error">{serverError}</p>}

        <div className="form-actions">
          <Link to={devicePath} className="button">Cancel</Link>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Add software'}
          </button>
        </div>
      </form>
    </>
  )
}

export default SoftwareForm
