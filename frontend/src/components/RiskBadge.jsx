import { formatScore, riskClass } from '../risk.js'

function RiskBadge({ score, level }) {
  const label = score === null || score === undefined
    ? level
    : `${formatScore(score)} ${level}`

  return <span className={`risk-badge ${riskClass(level)}`}>{label}</span>
}

export default RiskBadge
