const test = require("node:test");
const assert = require("node:assert/strict");
const { saveSnapshotIfChanged } = require("../services/scoreSnapshots");

// A fake database (stub) that remembers the last saved score and
// records every query, so only the snapshot rules are tested.
function fakePool(lastScore = null) {
  const queries = [];
  return {
    queries,
    async query(sql, params) {
      queries.push({ sql, params });
      if (sql.includes("SELECT overall_score")) {
        return { rows: lastScore === null ? [] : [{ overall_score: lastScore }] };
      }
      if (sql.includes("INSERT INTO score_snapshots")) {
        return { rows: [{ overall_score: params[1], risk_level: params[2] }] };
      }
      throw new Error("unexpected query");
    }
  };
}

const report = (riskScore, riskLevel = "Moderate") => async () => ({
  riskScore,
  riskLevel,
  devices: [{ id: "d1", name: "Laptop", riskScore, riskLevel, os: {}, software: [] }]
});

test("No snapshot while the score is Can't check", async () => {
  const pool = fakePool();
  const saved = await saveSnapshotIfChanged(pool, "u1", report(null, null));

  assert.equal(saved, null);
  assert.equal(pool.queries.length, 0);
});

test("First real score is saved", async () => {
  const pool = fakePool();
  const saved = await saveSnapshotIfChanged(pool, "u1", report(42));

  assert.equal(saved.overall_score, 42);
  const insert = pool.queries.find(q => q.sql.includes("INSERT"));
  assert.deepEqual(insert.params.slice(0, 3), ["u1", 42, "Moderate"]);
  assert.deepEqual(JSON.parse(insert.params[3]), [
    { id: "d1", name: "Laptop", riskScore: 42, riskLevel: "Moderate" }
  ]);
});

test("Same score as the last snapshot is not saved again", async () => {
  const pool = fakePool(42);
  const saved = await saveSnapshotIfChanged(pool, "u1", report(42));

  assert.equal(saved, null);
  assert.ok(!pool.queries.some(q => q.sql.includes("INSERT")));
});

test("A changed score is saved", async () => {
  const pool = fakePool(42);
  const saved = await saveSnapshotIfChanged(pool, "u1", report(18, "Low"));

  assert.equal(saved.overall_score, 18);
  assert.equal(saved.risk_level, "Low");
});

test("A score of 0 counts as a real score", async () => {
  const pool = fakePool();
  const saved = await saveSnapshotIfChanged(pool, "u1", report(0, "Low"));

  assert.equal(saved.overall_score, 0);
});
