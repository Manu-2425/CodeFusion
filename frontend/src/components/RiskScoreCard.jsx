import { formatScore, riskClass } from '../risk.js'
import RiskBadge from './RiskBadge.jsx'

function RiskScoreCard({ score, level }) {
  const hasScore = score !== null && score !== undefined

  return (
    <section className="card score-card">
      <h2>Your Risk Score</h2>
      <div
        className={`score-ring ${riskClass(level)}`}
        style={{ '--score': hasScore ? score : 0 }}
      >
        <div className="score-ring-inner">
          <span className="score-value">{formatScore(score)}</span>
          <span className="muted">out of 100</span>
        </div>
      </div>
      <RiskBadge level={level} />
      <p className="muted score-note">
        {hasScore
          ? 'Lower is safer.'
          : "We can't check your devices yet. Your score will appear once vulnerability data is available."}
      </p>
      <p className="score-scale">0 Low · 25 Moderate · 50 High · 75 Critical</p>
    </section>
  )
}

export default RiskScoreCard
