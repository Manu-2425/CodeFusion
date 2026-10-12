const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateRisk } = require("../services/riskScoring");

test("Incomplete assessment returns no score", () => {
  const result = calculateRisk();

  assert.equal(result.riskScore, null);
  assert.equal(result.riskLevel, "Not assessed");
});

test("Completed assessment with no findings returns zero", () => {
  const result = calculateRisk({
    assessmentComplete: true,
    findings: []
  });

  assert.equal(result.riskScore, 0);
  assert.equal(result.riskLevel, "No known findings");
});

test("Highest finding determines the score", () => {
  // Fictional findings used only for testing.
  const result = calculateRisk({
    assessmentComplete: true,
    findings: [
      { score: 25, recommendation: "Review the sample setting." },
      { score: 85, recommendation: "Apply the sample patch." }
    ]
  });

  assert.equal(result.riskScore, 85);
  assert.equal(result.riskLevel, "High");
  assert.equal(result.recommendations.length, 2);
});

test("Risk levels handle boundary scores correctly", () => {
  for (const [score, level] of [
    [1, "Low"],
    [39, "Low"],
    [40, "Medium"],
    [69, "Medium"],
    [70, "High"],
    [100, "High"]
  ]) {
    const result = calculateRisk({
      assessmentComplete: true,
      findings: [{ score, recommendation: "Sample action." }]
    });

    assert.equal(result.riskLevel, level);
  }
});

test("Invalid scores are rejected", () => {
  for (const score of [-1, 101, "85", null, 4.5]) {
    assert.throws(() => calculateRisk({
      assessmentComplete: true,
      findings: [{ score, recommendation: "Sample action." }]
    }), TypeError);
  }
});