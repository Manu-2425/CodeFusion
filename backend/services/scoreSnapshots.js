// Saves a user's overall risk score over time (R15, DR6).
//
// A snapshot is saved only when the overall score is a real number and
// is different from the user's last snapshot. While scores are still
// "Can't check" (no end-of-life or vulnerability data yet), nothing is
// saved; once real scores exist, snapshots start automatically.

const { getRiskReport } = require("./riskReport");

const HISTORY_RANGES = [30, 90, 365];

async function saveSnapshotIfChanged(pool, userId, getReport = getRiskReport) {
  const report = await getReport(pool, userId);

  if (typeof report.riskScore !== "number") {
    return null;
  }

  const last = await pool.query(
    `SELECT overall_score
     FROM score_snapshots
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (last.rows.length > 0 && last.rows[0].overall_score === report.riskScore) {
    return null;
  }

  const deviceScores = report.devices.map(device => ({
    id: device.id,
    name: device.name,
    riskScore: device.riskScore,
    riskLevel: device.riskLevel
  }));

  const inserted = await pool.query(
    `INSERT INTO score_snapshots (user_id, overall_score, risk_level, device_scores)
     VALUES ($1, $2, $3, $4)
     RETURNING snapshot_id, overall_score, risk_level, device_scores, created_at`,
    [userId, report.riskScore, report.riskLevel, JSON.stringify(deviceScores)]
  );

  return inserted.rows[0];
}

async function getScoreHistory(pool, userId, days) {
  const result = await pool.query(
    `SELECT snapshot_id, overall_score, risk_level, device_scores, created_at
     FROM score_snapshots
     WHERE user_id = $1
       AND created_at >= now() - make_interval(days => $2)
     ORDER BY created_at ASC`,
    [userId, days]
  );

  return result.rows;
}

module.exports = { saveSnapshotIfChanged, getScoreHistory, HISTORY_RANGES };
