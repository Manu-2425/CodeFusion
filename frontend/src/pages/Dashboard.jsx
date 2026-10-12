import { useEffect, useState } from 'react'
import { getRiskScore } from '../api.js'
import RiskScoreCard from '../components/RiskScoreCard.jsx'

function Dashboard() {
  const [report, setReport] = useState(null)

  useEffect(() => {
    getRiskScore().then(setReport)
  }, [])

  return (
    <>
      <h1>Dashboard</h1>
      {report && (
        <RiskScoreCard score={report.riskScore} level={report.riskLevel} />
      )}
    </>
  )
}

export default Dashboard
