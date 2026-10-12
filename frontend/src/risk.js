// Display helpers for risk levels returned by /api/risk-score.
// A null score means "Can't check" and must never be shown as 0.

const LEVEL_CLASSES = {
  Low: 'risk-low',
  Moderate: 'risk-moderate',
  High: 'risk-high',
  Critical: 'risk-critical'
}

export function riskClass(level) {
  return LEVEL_CLASSES[level] || 'risk-unknown'
}

export function formatScore(score) {
  return score === null || score === undefined ? '—' : String(score)
}
