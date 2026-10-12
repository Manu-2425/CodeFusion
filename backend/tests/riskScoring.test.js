const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateRisk,
  scoreItem,
  combineScores,
  scoreChecklist,
  scoreOverall,
  getRiskLevel
} = require("../services/riskScoring");

// All devices, versions and CVSS values below are fictional test data.

test("Risk levels follow the design bands", () => {
  for (const [score, level] of [
    [0, "Low"],
    [24, "Low"],
    [25, "Moderate"],
    [49, "Moderate"],
    [50, "High"],
    [74, "High"],
    [75, "Critical"],
    [100, "Critical"]
  ]) {
    assert.equal(getRiskLevel(score), level);
  }

  assert.equal(getRiskLevel(null), "Can't check");
});

test("Item score is 10 x CVSS plus the age penalty", () => {
  assert.equal(scoreItem({ verified: true, cvss: 0, status: "current" }), 0);
  assert.equal(scoreItem({ verified: true, cvss: 5, status: "current" }), 50);
  assert.equal(scoreItem({ verified: true, cvss: 5, status: "outdated" }), 65);
  assert.equal(scoreItem({ verified: true, cvss: 5, status: "end_of_life" }), 80);
  assert.equal(scoreItem({ verified: true, status: "end_of_life" }), 30);
});

test("Item score is capped at 100", () => {
  assert.equal(scoreItem({ verified: true, cvss: 9.8, status: "outdated" }), 100);
  assert.equal(scoreItem({ verified: true, cvss: 10, status: "end_of_life" }), 100);
});

test("Unverified items can't be checked instead of counting as safe", () => {
  assert.equal(scoreItem({ verified: false, cvss: 0 }), null);
});

test("Invalid item inputs are rejected", () => {
  for (const item of [
    {},
    { verified: "yes" },
    { verified: true, cvss: -1 },
    { verified: true, cvss: 10.1 },
    { verified: true, cvss: "7.5" },
    { verified: true, cvss: NaN },
    { verified: true, status: "old" }
  ]) {
    assert.throws(() => scoreItem(item), TypeError);
  }
});

test("Combined score is 0.6 x highest plus 0.4 x average", () => {
  // highest 80, average 50 -> 48 + 20
  assert.equal(combineScores([80, 20]), 68);
  assert.equal(combineScores([40]), 40);
});

test("Combined score skips items that can't be checked", () => {
  assert.equal(combineScores([80, null, 20]), 68);
  assert.equal(combineScores([null, null]), null);
  assert.equal(combineScores([]), null);
});

test("Invalid combined inputs are rejected", () => {
  for (const scores of [[101], [-1], [4.5], ["50"], "50"]) {
    assert.throws(() => combineScores(scores), TypeError);
  }
});

test("Checklist counts No fully and Not sure as half", () => {
  const answers = [
    { weight: 2, answer: "no" },
    { weight: 2, answer: "not_sure" },
    { weight: 4, answer: "yes" }
  ];

  // 100 x (2 + 1) / 8
  assert.equal(scoreChecklist(answers), 38);
  assert.equal(scoreChecklist([{ weight: 1, answer: "yes" }]), 0);
  assert.equal(scoreChecklist([]), null);
});

test("Invalid checklist answers are rejected", () => {
  for (const answer of [
    { weight: 1, answer: "maybe" },
    { weight: 0, answer: "no" },
    { weight: 1.5, answer: "no" },
    null
  ]) {
    assert.throws(() => scoreChecklist([answer]), TypeError);
  }
});

test("Overall score is 0.8 x inventory plus 0.2 x checklist", () => {
  assert.equal(scoreOverall({ inventoryScore: 73, checklistScore: 25 }), 63);
});

test("Overall score uses whichever part is available", () => {
  assert.equal(scoreOverall({ inventoryScore: 73 }), 73);
  assert.equal(scoreOverall({ checklistScore: 25 }), 25);
  assert.equal(scoreOverall({}), null);
});

test("Full report scores items, devices, inventory and overall", () => {
  const result = calculateRisk({
    devices: [
      {
        id: "laptop",
        name: "Sample Laptop",
        os: { verified: true, status: "end_of_life" },
        software: [
          { id: "a", name: "Sample Browser", verified: true, cvss: 9.8, status: "outdated" },
          { id: "b", name: "Sample Chat", verified: true, cvss: 6.5, status: "outdated" },
          { id: "c", name: "Sample Office", verified: true, cvss: 0, status: "current" },
          { id: "d", name: "Sample Budget App", verified: false }
        ]
      },
      {
        id: "desktop",
        name: "Sample Desktop",
        os: { verified: true, status: "outdated" },
        software: [
          { id: "e", name: "Sample Editor", verified: true, cvss: 5, status: "current" }
        ]
      }
    ],
    checklist: [
      { weight: 1, answer: "no" },
      { weight: 1, answer: "yes" },
      { weight: 1, answer: "yes" },
      { weight: 1, answer: "yes" },
      { weight: 1, answer: "not_sure" },
      { weight: 1, answer: "yes" }
    ]
  });

  const [laptop, desktop] = result.devices;

  // Laptop items: OS 30, 100 (capped), 80, 0, can't check
  assert.equal(laptop.os.riskScore, 30);
  assert.deepEqual(
    laptop.software.map(item => item.riskScore),
    [100, 80, 0, null]
  );
  assert.equal(laptop.software[3].riskLevel, "Can't check");

  // 0.6 x 100 + 0.4 x 52.5
  assert.equal(laptop.riskScore, 81);
  assert.equal(laptop.riskLevel, "Critical");

  // 0.6 x 50 + 0.4 x 32.5
  assert.equal(desktop.riskScore, 43);
  assert.equal(desktop.riskLevel, "Moderate");

  // 0.6 x 81 + 0.4 x 62
  assert.equal(result.inventoryScore, 73);
  assert.equal(result.checklistScore, 25);

  // 0.8 x 73 + 0.2 x 25
  assert.equal(result.riskScore, 63);
  assert.equal(result.riskLevel, "High");
});

test("Device without software is scored on its OS alone", () => {
  const result = calculateRisk({
    devices: [{ os: { verified: true, status: "outdated" } }]
  });

  assert.equal(result.devices[0].riskScore, 15);
  assert.equal(result.riskScore, 15);
  assert.equal(result.riskLevel, "Low");
});

test("No devices and no checklist returns no score", () => {
  const result = calculateRisk();

  assert.equal(result.riskScore, null);
  assert.equal(result.riskLevel, "Can't check");
  assert.deepEqual(result.devices, []);
});

test("Invalid devices are rejected", () => {
  for (const devices of ["laptop", [{}], [{ os: null }], [{ os: { verified: true }, software: "x" }]]) {
    assert.throws(() => calculateRisk({ devices }), TypeError);
  }
});
