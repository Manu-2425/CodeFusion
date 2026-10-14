// Cyber Buddy risk scoring (Design doc: Risk Scoring Model, DR5).
// All scores run from 0 to 100, and higher means riskier.
// Weights and bands live in config/scoring.json so they can be tuned.
// A score of null means "Can't check" (no data to score the item with).

const config = require("../config/scoring.json");

const ITEM_STATUSES = Object.keys(config.item.agePenalty);
const CHECKLIST_ANSWERS = ["yes", "no", "not_sure"];

function isScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

/*
 * Band for a score: Low, Moderate, High or Critical.
 * Returns "Can't check" when there is no score.
 */
function getRiskLevel(score) {
  if (score === null) {
    return "Can't check";
  }

  if (!isScore(score)) {
    throw new TypeError("Score must be an integer from 0 to 100 or null");
  }

  return config.bands.find(band => score >= band.min).level;
}

/*
 * Software or OS item:
 * 10 x highest CVSS among matched CVEs + age penalty, capped at 100.
 * Unverified items cannot be matched to vulnerability data, so they
 * return null instead of being treated as safe.
 */
function scoreItem({ verified, cvss = 0, status = "current" } = {}) {
  if (typeof verified !== "boolean") {
    throw new TypeError("verified must be a boolean");
  }

  if (typeof cvss !== "number" || !(cvss >= 0 && cvss <= 10)) {
    throw new TypeError("cvss must be a number from 0 to 10");
  }

  if (!ITEM_STATUSES.includes(status)) {
    throw new TypeError(`status must be one of: ${ITEM_STATUSES.join(", ")}`);
  }

  if (!verified) {
    return null;
  }

  const score =
    config.item.cvssMultiplier * cvss + config.item.agePenalty[status];

  return Math.min(100, Math.round(score));
}

/*
 * Combines scores at the device and inventory level:
 * 0.6 x highest score + 0.4 x average score.
 * Items that can't be checked (null) are left out.
 */
function combineScores(scores) {
  if (!Array.isArray(scores)) {
    throw new TypeError("scores must be an array");
  }

  for (const score of scores) {
    if (score !== null && !isScore(score)) {
      throw new TypeError("Each score must be an integer from 0 to 100 or null");
    }
  }

  const known = scores.filter(score => score !== null);

  if (known.length === 0) {
    return null;
  }

  const highest = Math.max(...known);
  const average = known.reduce((sum, score) => sum + score, 0) / known.length;

  return Math.round(
    config.aggregate.highestWeight * highest +
    config.aggregate.averageWeight * average
  );
}

/*
 * Checklist (R10):
 * 100 x (weight answered No + 1/2 x weight answered Not sure) / total weight.
 */
function scoreChecklist(answers = []) {
  if (!Array.isArray(answers)) {
    throw new TypeError("answers must be an array");
  }

  let totalWeight = 0;
  let riskWeight = 0;

  for (const item of answers) {
    if (!item || !Number.isInteger(item.weight) || item.weight <= 0) {
      throw new TypeError("Each checklist answer needs a positive integer weight");
    }

    if (!CHECKLIST_ANSWERS.includes(item.answer)) {
      throw new TypeError(
        `answer must be one of: ${CHECKLIST_ANSWERS.join(", ")}`
      );
    }

    totalWeight += item.weight;

    if (item.answer === "no") {
      riskWeight += item.weight;
    } else if (item.answer === "not_sure") {
      riskWeight += config.checklist.notSureFactor * item.weight;
    }
  }

  if (totalWeight === 0) {
    return null;
  }

  return Math.round((100 * riskWeight) / totalWeight);
}

/*
 * Overall (R7): 0.8 x inventory + 0.2 x checklist.
 * Until the checklist is answered, the inventory score is used on its own
 * (and the other way around), rather than counting the missing part as 0.
 */
function scoreOverall({ inventoryScore = null, checklistScore = null } = {}) {
  for (const score of [inventoryScore, checklistScore]) {
    if (score !== null && !isScore(score)) {
      throw new TypeError("Scores must be integers from 0 to 100 or null");
    }
  }

  if (inventoryScore === null) {
    return checklistScore;
  }

  if (checklistScore === null) {
    return inventoryScore;
  }

  return Math.round(
    config.overall.inventoryWeight * inventoryScore +
    config.overall.checklistWeight * checklistScore
  );
}

function scoredItem(item) {
  const riskScore = scoreItem(item);

  return {
    id: item.id ?? null,
    name: item.name ?? null,
    riskScore,
    riskLevel: getRiskLevel(riskScore)
  };
}

/*
 * Full report for one user.
 * Each device's operating system counts as one of its items (R17).
 *
 * Input:
 *   devices: [{ id, name, os: { verified, cvss, status },
 *               software: [{ id, name, verified, cvss, status }] }]
 *   checklist: [{ weight, answer }]
 */
function calculateRisk({ devices = [], checklist = [] } = {}) {
  if (!Array.isArray(devices)) {
    throw new TypeError("devices must be an array");
  }

  const scoredDevices = devices.map(device => {
    if (!device || typeof device.os !== "object" || device.os === null) {
      throw new TypeError("Each device needs an os item");
    }

    const software = device.software ?? [];

    if (!Array.isArray(software)) {
      throw new TypeError("device.software must be an array");
    }

    const os = scoredItem(device.os);
    const items = software.map(scoredItem);
    const riskScore = combineScores(
      [os, ...items].map(item => item.riskScore)
    );

    return {
      id: device.id ?? null,
      name: device.name ?? null,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      os,
      software: items
    };
  });

  const inventoryScore = combineScores(
    scoredDevices.map(device => device.riskScore)
  );
  const checklistScore = scoreChecklist(checklist);
  const riskScore = scoreOverall({ inventoryScore, checklistScore });

  return {
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    inventoryScore,
    checklistScore,
    devices: scoredDevices
  };
}

module.exports = {
  calculateRisk,
  scoreItem,
  combineScores,
  scoreChecklist,
  scoreOverall,
  getRiskLevel
};
