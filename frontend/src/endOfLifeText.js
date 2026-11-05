// Plain-language support status for an operating system (R6).
// endOfLife comes from the risk report: { status, eolDate, latest } or null.

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  })
}

export function endOfLifeText(endOfLife, osName = '') {
  if (!endOfLife) return null

  const { status, eolDate, latest } = endOfLife

  if (status === 'end_of_life') {
    return {
      tone: 'bad',
      text: eolDate
        ? `No longer supported since ${formatDate(eolDate)}. Upgrade to a newer version to keep getting security fixes.`
        : 'No longer supported. Upgrade to a newer version to keep getting security fixes.'
    }
  }

  if (status === 'outdated') {
    return {
      tone: 'warn',
      text: latest
        ? `An update is available: ${[osName, latest].filter(Boolean).join(' ')}.`
        : 'An update is available.'
    }
  }

  return {
    tone: 'good',
    text: eolDate
      ? `Supported and up to date. Security updates until ${formatDate(eolDate)}.`
      : 'Supported and up to date.'
  }
}
