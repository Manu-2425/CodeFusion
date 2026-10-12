import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createSoftware, getSoftware, updateSoftware } from '../api.js'
import FormField from '../components/FormField.jsx'
import StatusMessage from '../components/StatusMessage.jsx'
import { validateSoftware } from '../validation.js'

const EMPTY_SOFTWARE = { name: '', version: '', vendor: '' }

// Used for both adding (/devices/:deviceId/software/new) and editing
// (/devices/:deviceId/software/:softwareId/edit).
function SoftwareForm() {
  const { deviceId, softwareId } = useParams()
  const isEdit = Boolean(softwareId)
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY_SOFTWARE)
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState(null)

  const devicePath = `/devices/${deviceId}`

  useEffect(() => {
    if (!isEdit) return

    let active = true

    getSoftware(deviceId)
      .then(software => {
        if (!active) return

        const item = software.find(entry => entry.software_id === softwareId)

        if (!item) {
          setLoadError('This program may have been removed.')
        } else {
          setValues({
            name: item.name,
            version: item.version,
            vendor: item.vendor ?? ''
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
  }, [deviceId, softwareId, isEdit])

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
      const fields = {
        name: values.name.trim(),
        version: values.version.trim(),
        vendor: values.vendor.trim() || undefined
      }

      if (isEdit) {
        await updateSoftware(softwareId, fields)
      } else {
        await createSoftware(deviceId, fields)
      }

      navigate(devicePath)
    } catch (err) {
      setServerError(err.message)
      setSaving(false)
    }
  }

  if (loading) {
    return <StatusMessage title="Loading software…" />
  }

  if (loadError) {
    return (
      <StatusMessage title="Couldn't load this program" tone="error">
        {loadError}
      </StatusMessage>
    )
  }

  return (
    <>
      <p className="breadcrumb">
        <Link to="/">Dashboard</Link> › <Link to={devicePath}>Device</Link> ›{' '}
        {isEdit ? 'Edit software' : 'Add software'}
      </p>
      <h1>{isEdit ? 'Edit software' : 'Add software'}</h1>
      <p className="muted">
        {isEdit
          ? 'Correct the name or version of this program.'
          : 'Add a program installed on this device.'}
      </p>

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
          {isEdit ? 'Edited' : 'New'} programs are saved as <strong>unverified</strong> and show as
          &ldquo;Can&apos;t check&rdquo; until they can be matched to
          vulnerability data.
        </p>

        {serverError && <p className="field-error">{serverError}</p>}

        <div className="form-actions">
          <Link to={devicePath} className="button">Cancel</Link>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add software'}
          </button>
        </div>
      </form>
    </>
  )
}

export default SoftwareForm
