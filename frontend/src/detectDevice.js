// "Detect this computer" (design DR13, Flow D).
//
// Chrome and Edge can tell a website the real operating system version and
// the browser version through User-Agent Client Hints. Nothing is sent to
// the server here: the values only fill in the Add Device form, and the user
// can change them before saving. Safari and Firefox do not share these
// details, so there the form is filled in by hand.

const KNOWN_BROWSERS = ['Microsoft Edge', 'Google Chrome', 'Opera', 'Brave', 'Vivaldi']

// True when this browser can share the operating system and browser details.
export function canDetect(nav = globalThis.navigator) {
  return Boolean(nav?.userAgentData?.getHighEntropyValues)
}

// "26.0.0" -> "26.0", "15.3.1" -> "15.3.1"
function tidyVersion(version) {
  const parts = String(version || '').trim().split('.')
  while (parts.length > 2 && parts[parts.length - 1] === '0') {
    parts.pop()
  }
  return parts.join('.')
}

// Turns the browser's platform report into the form's operating system
// fields. Returns null for platforms the form cannot fill in.
export function mapPlatform(platform, platformVersion) {
  const version = String(platformVersion || '').trim()
  const major = Number.parseInt(version.split('.')[0], 10)

  switch (platform) {
    case 'macOS':
      return { os_name: 'macOS', os_version: tidyVersion(version) }

    case 'Windows':
      // Windows reports 13 or higher for Windows 11 and 1 to 10 for
      // Windows 10. Older versions report 0, so the user types it in.
      if (major >= 13) return { os_name: 'Windows', os_version: '11' }
      if (major >= 1) return { os_name: 'Windows', os_version: '10' }
      return { os_name: 'Windows', os_version: '' }

    case 'Android':
      return { os_name: 'Android', os_version: Number.isNaN(major) ? '' : String(major) }

    case 'Chrome OS':
    case 'ChromeOS':
      return { os_name: 'ChromeOS', os_version: tidyVersion(version) }

    case 'Linux':
      // Linux does not report a distribution version.
      return { os_name: 'Linux', os_version: '' }

    default:
      return null
  }
}

// Picks the real browser out of the brand list, skipping placeholder brands
// such as "Not A(Brand". Returns { name, version } or null.
export function pickBrowser(fullVersionList = []) {
  const brands = fullVersionList.filter(
    item => item?.brand && item?.version && !/not.?a.?brand/i.test(item.brand)
  )
  const known = brands.find(item => KNOWN_BROWSERS.includes(item.brand))
  const chosen = known || brands.find(item => item.brand === 'Chromium') || brands[0]

  return chosen ? { name: chosen.brand, version: chosen.version } : null
}

export function suggestedName(osName) {
  switch (osName) {
    case 'macOS': return 'My Mac'
    case 'Windows': return 'My Windows PC'
    case 'ChromeOS': return 'My Chromebook'
    case 'Android': return 'My Android phone'
    default: return 'My computer'
  }
}

// Reads this computer's details. Resolves to
//   { os_name, os_version, device_type, browser }
// or rejects with a plain-language message when detection is not possible.
export async function detectThisComputer(nav = globalThis.navigator) {
  if (!canDetect(nav)) {
    throw new Error(
      'This browser doesn’t share these details. Please fill them in below, or try Chrome or Edge.'
    )
  }

  const values = await nav.userAgentData.getHighEntropyValues([
    'platform',
    'platformVersion',
    'fullVersionList'
  ])
  const os = mapPlatform(values.platform, values.platformVersion)

  if (!os) {
    throw new Error('We couldn’t recognise this operating system. Please fill it in below.')
  }

  return {
    ...os,
    device_type: nav.userAgentData.mobile ? 'Phone' : 'Laptop/Desktop',
    browser: pickBrowser(values.fullVersionList)
  }
}
