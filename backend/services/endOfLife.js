// Operating system end-of-life check (R6, F4).
//
// Looks up each operating system on endoflife.date and decides whether
// the user's version is:
//   current      - still supported and on the latest update
//   outdated     - still supported, but a newer update is available
//   end_of_life  - no longer supported
// These are the three age statuses the scoring engine already uses
// (0 / 15 / 30 points, config/scoring.json).
//
// If a system isn't listed, the version can't be matched, or the service
// can't be reached, the result is null and the item stays "Can't check"
// instead of failing the request (NF3).
//
// Data is cached per product for 24 hours, so scores reflect changes
// within a day (NF6) without calling the service on every request.

const config = require("../config/sources.json").endOfLife;

const BASE_URL = process.env.END_OF_LIFE_API_URL || config.baseUrl;
const CACHE_MS = config.cacheHours * 60 * 60 * 1000;
const cache = new Map();

function clearCache() {
  cache.clear();
}

// Compares dotted versions: -1 if a < b, 0 if equal, 1 if a > b.
function compareVersions(a, b) {
  const left = String(a).split(".").map(part => Number.parseInt(part, 10) || 0);
  const right = String(b).split(".").map(part => Number.parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i += 1) {
    const difference = (left[i] || 0) - (right[i] || 0);
    if (difference !== 0) return difference < 0 ? -1 : 1;
  }
  return 0;
}

// eol is false (still supported), true (ended), or a "YYYY-MM-DD" date.
function hasEnded(eol, today) {
  if (eol === true) return true;
  if (typeof eol === "string" && /^\d{4}-\d{2}-\d{2}$/.test(eol)) {
    return today >= eol;
  }
  return false;
}

function todayString(now) {
  return now.toISOString().slice(0, 10);
}

// macOS 10.x releases are listed as "10.15"; later ones by major ("26").
function appleCycle(version) {
  const parts = String(version).trim().split(".");
  if (!parts[0]) return null;
  return parts[0] === "10" && parts[1] ? `10.${parts[1]}` : parts[0];
}

/*
 * Decides the age status from endoflife.date cycles.
 * Returns { status, cycle, eolDate, latest } or null when no match.
 */
function evaluate(osName, version, cycles, now = new Date()) {
  if (!Array.isArray(cycles) || !version) return null;
  const today = todayString(now);
  const trimmed = String(version).trim();

  if (osName === "Windows") {
    // Windows is listed per feature update ("11-24h2-w", "10-22h2", ...).
    // Cyber Buddy only knows the major version (10 or 11), so the version
    // counts as supported while any consumer release of it still is.
    const major = trimmed.split(".")[0];
    const releases = cycles.filter(item =>
      typeof item.cycle === "string" &&
      item.cycle.startsWith(`${major}-`) &&
      !/lts|iot|-e$/i.test(item.cycle)
    );
    if (releases.length === 0) return null;

    const supported = releases.filter(item => !hasEnded(item.eol, today));
    const latestEol = releases
      .map(item => (typeof item.eol === "string" ? item.eol : null))
      .filter(Boolean)
      .sort()
      .pop() || null;

    return {
      status: supported.length > 0 ? "current" : "end_of_life",
      cycle: major,
      eolDate: latestEol,
      latest: null
    };
  }

  const cycleName = osName === "Android" ? trimmed.split(".")[0] : appleCycle(trimmed);
  const cycle = cycles.find(item => String(item.cycle) === cycleName);
  if (!cycle) return null;

  const eolDate = typeof cycle.eol === "string" ? cycle.eol : null;

  if (hasEnded(cycle.eol, today)) {
    return { status: "end_of_life", cycle: cycleName, eolDate, latest: cycle.latest ?? null };
  }

  // Apple systems report the full version, so a missing update can be seen.
  const comparesUpdates = osName !== "Android" && typeof cycle.latest === "string";
  const outdated = comparesUpdates && compareVersions(trimmed, cycle.latest) < 0;

  return {
    status: outdated ? "outdated" : "current",
    cycle: cycleName,
    eolDate,
    latest: cycle.latest ?? null
  };
}

async function fetchCycles(product, fetchImpl) {
  const cached = cache.get(product);
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) {
    return cached.data;
  }

  try {
    const response = await fetchImpl(`${BASE_URL}/${product}.json`, {
      signal: AbortSignal.timeout(config.timeoutMs)
    });
    if (!response.ok) throw new Error(`endoflife.date returned ${response.status}`);

    const data = await response.json();
    cache.set(product, { data, fetchedAt: Date.now() });
    return data;
  } catch (error) {
    console.error(`End-of-life lookup failed for ${product}:`, error.message);
    // Use older data if we have it; otherwise the OS stays "Can't check".
    return cached ? cached.data : null;
  }
}

/*
 * checkOperatingSystem("macOS", "26.6.2")
 *   -> { status: "current", cycle: "26", eolDate: null, latest: "26.6.2" }
 *   or null when it can't be checked.
 */
async function checkOperatingSystem(osName, version, { fetchImpl = fetch, now } = {}) {
  const product = config.products[osName];
  if (!product || !version || !String(version).trim()) return null;

  const cycles = await fetchCycles(product, fetchImpl);
  if (!cycles) return null;

  return evaluate(osName, version, cycles, now);
}

module.exports = { checkOperatingSystem, evaluate, compareVersions, clearCache };
