// Project scoring rule: use the highest finding score.
// Each finding must have a score from 0 to 100.
// These thresholds are project rules, not an official standard.

function calculateRisk({
  assessmentComplete = false,
  findings = []
} = {}) {
  if (typeof assessmentComplete !== "boolean") {
    throw new TypeError("assessmentComplete must be a boolean");
  }

  if (!Array.isArray(findings)) {
    throw new TypeError("findings must be an array");
  }

  for (const finding of findings) {
    if (
      !finding ||
      !Number.isInteger(finding.score) ||
      finding.score < 0 ||
      finding.score > 100
    ) {
      throw new TypeError("Each finding needs an integer score from 0 to 100");
    }

    if (
      typeof finding.recommendation !== "string" ||
      !finding.recommendation.trim()
    ) {
      throw new TypeError("Each finding needs a recommendation");
    }
  }

  if (!assessmentComplete) {
    return {
      riskScore: null,
      riskLevel: "Not assessed",
      recommendations: ["Complete the vulnerability assessment."]
    };
  }

  const riskScore = findings.reduce(
    (highest, finding) => Math.max(highest, finding.score),
    0
  );

  let riskLevel;

  if (riskScore === 0) {
    riskLevel = "No known findings";
  } else if (riskScore < 40) {
    riskLevel = "Low";
  } else if (riskScore < 70) {
    riskLevel = "Medium";
  } else {
    riskLevel = "High";
  }

  const recommendations = [
    ...new Set(
      findings.map(finding => finding.recommendation.trim())
    )
  ];

  return {
    riskScore,
    riskLevel,
    recommendations
  };
}

module.exports = { calculateRisk };