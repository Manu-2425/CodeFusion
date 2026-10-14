const test = require("node:test");
const assert = require("node:assert/strict");
const { getRiskReport, toScoringInput } = require("../services/riskReport");

// Fictional rows shaped like the devices and software tables.
const deviceRows = [
  { device_id: "d1", name: "Sample Laptop", os_name: "Windows", os_version: "10" },
  { device_id: "d2", name: "Sample Phone", os_name: "Android", os_version: "14" }
];

const softwareRows = [
  { software_id: "s1", device_id: "d1", name: "Sample Browser", match_status: "unverified" },
  { software_id: "s2", device_id: "d1", name: "Sample Office", match_status: "verified" }
];

test("Rows are grouped into devices with their software", () => {
  const [laptop, phone] = toScoringInput(deviceRows, softwareRows);

  assert.equal(laptop.os.name, "Windows 10");
  assert.equal(laptop.os.verified, false);
  assert.deepEqual(
    laptop.software.map(item => [item.id, item.verified]),
    [["s1", false], ["s2", true]]
  );
  assert.deepEqual(phone.software, []);
});

test("Report reads the user's inventory and scores it", async () => {
  const calls = [];
  const fakePool = {
    query: async (sql, params) => {
      calls.push(params);
      return { rows: calls.length === 1 ? deviceRows : softwareRows };
    }
  };

  const userId = "11111111-1111-4111-8111-111111111111";
  const report = await getRiskReport(fakePool, userId);

  assert.deepEqual(calls, [[userId], [userId]]);
  assert.equal(report.devices.length, 2);

  // No vulnerability data yet: only the verified program has a score.
  assert.equal(report.devices[0].riskScore, 0);
  assert.equal(report.devices[0].os.riskLevel, "Can't check");
  assert.equal(report.devices[1].riskScore, null);
  assert.equal(report.riskScore, 0);
});

test("Empty inventory returns no score", async () => {
  const fakePool = { query: async () => ({ rows: [] }) };
  const report = await getRiskReport(fakePool, "11111111-1111-4111-8111-111111111111");

  assert.equal(report.riskScore, null);
  assert.equal(report.riskLevel, "Can't check");
});
