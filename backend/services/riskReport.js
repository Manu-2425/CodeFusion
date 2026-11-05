// Loads a user's inventory and runs it through the risk scoring engine.
// Scores are calculated on request; scoreSnapshots saves them over time.

const { calculateRisk } = require("./riskScoring");
const { checkOperatingSystem } = require("./endOfLife");

/*
 * Turns database rows into scoring input.
 *
 * osChecks maps device_id to the end-of-life result for its operating
 * system ({ status, ... } or null). A checked OS is scored on its age
 * (current, outdated or end_of_life) with no CVEs yet; an unchecked OS
 * stays "Can't check". Software uses its match_status with no findings
 * until the vulnerability check exists.
 */
function toScoringInput(deviceRows, softwareRows, osChecks = {}) {
  return deviceRows.map(device => {
    const check = osChecks[device.device_id] || null;
    const osName = `${device.os_name} ${device.os_version}`;

    return {
      id: device.device_id,
      name: device.name,
      os: check
        ? { name: osName, verified: true, cvss: 0, status: check.status }
        : { name: osName, verified: false },
      software: softwareRows
        .filter(item => item.device_id === device.device_id)
        .map(item => ({
          id: item.software_id,
          name: item.name,
          verified: item.match_status === "verified"
        }))
    };
  });
}

async function getRiskReport(pool, userId, { checkOs = checkOperatingSystem } = {}) {
  const devicesResult = await pool.query(
    `SELECT d.device_id, d.name, d.os_name, d.os_version
     FROM devices d
     WHERE d.user_id = $1
       AND d.deleted_at IS NULL
     ORDER BY d.created_at DESC`,
    [userId]
  );

  const softwareResult = await pool.query(
    `SELECT s.software_id, s.device_id, s.name, s.match_status
     FROM software s
     JOIN devices d ON d.device_id = s.device_id
     WHERE d.user_id = $1
       AND s.deleted_at IS NULL
       AND d.deleted_at IS NULL
     ORDER BY s.created_at DESC`,
    [userId]
  );

  const osChecks = {};
  await Promise.all(
    devicesResult.rows.map(async device => {
      osChecks[device.device_id] = await checkOs(device.os_name, device.os_version);
    })
  );

  const report = calculateRisk({
    devices: toScoringInput(devicesResult.rows, softwareResult.rows, osChecks)
  });

  // Pass the end-of-life details through so the device page can say why.
  report.devices.forEach((device, index) => {
    device.os.endOfLife = osChecks[devicesResult.rows[index].device_id] || null;
  });

  return report;
}

module.exports = { getRiskReport, toScoringInput };
