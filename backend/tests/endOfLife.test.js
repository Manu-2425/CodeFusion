const test = require("node:test");
const assert = require("node:assert/strict");
const {
  checkOperatingSystem,
  evaluate,
  compareVersions,
  clearCache
} = require("../services/endOfLife");

// Sample data shaped like endoflife.date's /api/<product>.json responses.
const macos = [
  { cycle: "26", releaseDate: "2025-09-15", eol: false, latest: "26.7" },
  { cycle: "15", releaseDate: "2024-09-16", eol: false, latest: "15.7.3" },
  { cycle: "13", releaseDate: "2022-10-24", eol: "2025-09-15", latest: "13.7.8" },
  { cycle: "10.15", releaseDate: "2019-10-07", eol: "2022-09-12", latest: "10.15.7" }
];

const windows = [
  { cycle: "11-25h2-w", releaseDate: "2025-09-30", eol: "2027-10-12" },
  { cycle: "11-24h2-w", releaseDate: "2024-10-01", eol: "2026-10-13" },
  { cycle: "11-24h2-e", releaseDate: "2024-10-01", eol: "2027-10-12" },
  { cycle: "10-22h2", releaseDate: "2022-10-18", eol: "2025-10-14" },
  { cycle: "10-21h2-e-lts", releaseDate: "2021-11-16", eol: "2027-01-12" }
];

const android = [
  { cycle: "16", releaseDate: "2025-06-10", eol: false },
  { cycle: "12", releaseDate: "2021-10-04", eol: "2025-03-31" }
];

const now = new Date("2026-11-04T12:00:00Z");

test("macOS on the latest update is current", () => {
  assert.equal(evaluate("macOS", "26.7", macos, now).status, "current");
});

test("macOS behind the latest update is outdated", () => {
  const result = evaluate("macOS", "26.6.2", macos, now);
  assert.equal(result.status, "outdated");
  assert.equal(result.latest, "26.7");
});

test("macOS past its end-of-life date is end_of_life", () => {
  const result = evaluate("macOS", "13.6", macos, now);
  assert.equal(result.status, "end_of_life");
  assert.equal(result.eolDate, "2025-09-15");
});

test("Old macOS 10.x versions are matched by major and minor", () => {
  assert.equal(evaluate("macOS", "10.15.7", macos, now).status, "end_of_life");
});

test("End of life starts on the end-of-life day (boundary)", () => {
  const dayBefore = new Date("2025-09-14T12:00:00Z");
  const eolDay = new Date("2025-09-15T12:00:00Z");
  assert.notEqual(evaluate("macOS", "13.7.8", macos, dayBefore).status, "end_of_life");
  assert.equal(evaluate("macOS", "13.7.8", macos, eolDay).status, "end_of_life");
});

test("Windows 11 is current while a consumer release is supported", () => {
  const result = evaluate("Windows", "11", windows, now);
  assert.equal(result.status, "current");
  assert.equal(result.eolDate, "2027-10-12");
});

test("Windows 10 is end_of_life, ignoring LTSC editions", () => {
  assert.equal(evaluate("Windows", "10", windows, now).status, "end_of_life");
});

test("Android is matched by major version", () => {
  assert.equal(evaluate("Android", "16", android, now).status, "current");
  assert.equal(evaluate("Android", "12.1", android, now).status, "end_of_life");
});

test("Unknown versions are not guessed", () => {
  assert.equal(evaluate("macOS", "99.1", macos, now), null);
  assert.equal(evaluate("Windows", "7", windows, now), null);
  assert.equal(evaluate("macOS", "", macos, now), null);
});

test("Versions are compared part by part", () => {
  assert.equal(compareVersions("26.6.2", "26.7"), -1);
  assert.equal(compareVersions("26.10", "26.9"), 1);
  assert.equal(compareVersions("15.7", "15.7.0"), 0);
});

test("Systems not on endoflife.date are not checked", async () => {
  clearCache();
  let called = false;
  const fetchImpl = async () => { called = true; };
  assert.equal(await checkOperatingSystem("Linux", "6.8", { fetchImpl }), null);
  assert.equal(called, false);
});

test("The lookup uses the service and caches the result", async () => {
  clearCache();
  const urls = [];
  const fetchImpl = async url => {
    urls.push(url);
    return { ok: true, json: async () => macos };
  };

  const first = await checkOperatingSystem("macOS", "26.6.2", { fetchImpl, now });
  const second = await checkOperatingSystem("macOS", "26.7", { fetchImpl, now });

  assert.equal(first.status, "outdated");
  assert.equal(second.status, "current");
  assert.equal(urls.length, 1);
  assert.match(urls[0], /\/macos\.json$/);
});

test("If the service can't be reached, the OS stays Can't check", async () => {
  clearCache();
  const fetchImpl = async () => { throw new Error("network down"); };
  assert.equal(await checkOperatingSystem("Windows", "11", { fetchImpl }), null);
});
