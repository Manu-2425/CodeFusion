// Loads a user's inventory and runs it through the risk scoring engine.
// Read-only: scores are calculated on request and not saved yet.

const { calculateRisk } = require("./riskScoring");

/*
 * Turns database rows into scoring input.
 *
 * Until the vulnerability and end-of-life checks exist, there are no
 * CVSS or outdated values to pass in. Operating systems are therefore
 * sent as unverified, and software uses its match_status with no
 * findings. Both show as "Can't check" until that data is available.
 */
function toScoringInput(deviceRows, softwareRows) {
  return deviceRows.map(device => ({
    id: device.device_id,
    name: device.name,
    os: {
      name: `${device.os_name} ${device.os_version}`,
      verified: false
    },
    software: softwareRows
      .filter(item => item.device_id === device.device_id)
      .map(item => ({
        id: item.software_id,
        name: item.name,
        verified: item.match_status === "verified"
      }))
  }));
}

async function getRiskReport(pool, email) {
  const devicesResult = await pool.query(
    `SELECT d.device_id, d.name, d.os_name, d.os_version
     FROM devices d
     JOIN users u ON u.user_id = d.user_id
     WHERE u.email = $1
       AND d.deleted_at IS NULL
     ORDER BY d.created_at DESC`,
    [email]
  );

  const softwareResult = await pool.query(
    `SELECT s.software_id, s.device_id, s.name, s.match_status
     FROM software s
     JOIN devices d ON d.device_id = s.device_id
     JOIN users u ON u.user_id = d.user_id
     WHERE u.email = $1
       AND s.deleted_at IS NULL
       AND d.deleted_at IS NULL
     ORDER BY s.created_at DESC`,
    [email]
  );

  return calculateRisk({
    devices: toScoringInput(devicesResult.rows, softwareResult.rows)
  });
}

module.exports = { getRiskReport, toScoringInput };
