// API tests. Run against a running backend:
//   npm start            (in one terminal)
//   node --test tests/api.test.js   (in another)
// Each run signs up two fresh users, so the tests can be repeated.

const { test, before } = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL = process.env.API_URL || "http://localhost:5001";
const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

// Sends a request, keeping the session cookie for a logged-in user.
async function call(path, { method = "GET", body, cookie } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
}

// Creates an account, logs in and returns the session cookie.
async function signUpAndLogIn(label) {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
  const password = "correct-horse-battery";

  const registered = await call("/api/auth/register", {
    method: "POST",
    body: { email, password, display_name: label }
  });
  assert.equal(registered.status, 201);

  const login = await call("/api/auth/login", {
    method: "POST",
    body: { email, password }
  });
  assert.equal(login.status, 200);

  return login.headers.get("set-cookie").split(";")[0];
}

const laptop = {
  name: "Test Laptop",
  device_type: "Laptop/Desktop",
  os_name: "Windows",
  os_version: "11"
};

let alice;
let bob;

before(async () => {
  alice = await signUpAndLogIn("alice");
  bob = await signUpAndLogIn("bob");
});

test("Health API returns OK", async () => {
  const { status, data } = await call("/api/health");

  assert.equal(status, 200);
  assert.equal(data.status, "OK");
});

test("Inventory and score routes require login", async () => {
  const checks = [
    ["GET", "/api/devices"],
    ["POST", "/api/devices"],
    ["PUT", `/api/devices/${UNKNOWN_ID}`],
    ["DELETE", `/api/devices/${UNKNOWN_ID}`],
    ["GET", `/api/devices/${UNKNOWN_ID}/software`],
    ["POST", `/api/devices/${UNKNOWN_ID}/software`],
    ["PUT", `/api/software/${UNKNOWN_ID}`],
    ["DELETE", `/api/software/${UNKNOWN_ID}`],
    ["GET", "/api/risk-score"],
    ["GET", "/api/score-history"]
  ];

  for (const [method, path] of checks) {
    const body = method === "GET" || method === "DELETE" ? undefined : {};
    const { status, data } = await call(path, { method, body });
    assert.equal(status, 401, `${method} ${path}`);
    assert.equal(data.message, "Not authenticated");
  }
});

test("A new user starts with an empty inventory", async () => {
  const { status, data } = await call("/api/devices", { cookie: bob });

  assert.equal(status, 200);
  assert.deepEqual(data.devices, []);
});

test("Users only see their own devices", async () => {
  const added = await call("/api/devices", {
    method: "POST",
    body: laptop,
    cookie: alice
  });
  assert.equal(added.status, 201);
  const deviceId = added.data.device.device_id;

  const aliceList = await call("/api/devices", { cookie: alice });
  assert.ok(aliceList.data.devices.some(d => d.device_id === deviceId));

  const bobList = await call("/api/devices", { cookie: bob });
  assert.ok(!bobList.data.devices.some(d => d.device_id === deviceId));
});

test("Users cannot edit, remove or add software to another user's device", async () => {
  const added = await call("/api/devices", {
    method: "POST",
    body: laptop,
    cookie: alice
  });
  const deviceId = added.data.device.device_id;

  const edit = await call(`/api/devices/${deviceId}`, {
    method: "PUT",
    body: { ...laptop, name: "Taken over" },
    cookie: bob
  });
  assert.equal(edit.status, 404);

  const remove = await call(`/api/devices/${deviceId}`, {
    method: "DELETE",
    cookie: bob
  });
  assert.equal(remove.status, 404);

  const listSoftware = await call(`/api/devices/${deviceId}/software`, {
    cookie: bob
  });
  assert.equal(listSoftware.status, 404);

  const addSoftware = await call(`/api/devices/${deviceId}/software`, {
    method: "POST",
    body: { name: "Sneaky App", version: "1.0" },
    cookie: bob
  });
  assert.equal(addSoftware.status, 404);

  // Alice's device is unchanged and still there.
  const aliceList = await call("/api/devices", { cookie: alice });
  const device = aliceList.data.devices.find(d => d.device_id === deviceId);
  assert.equal(device.name, laptop.name);
});

test("Users cannot edit or remove another user's software", async () => {
  const added = await call("/api/devices", {
    method: "POST",
    body: laptop,
    cookie: alice
  });
  const deviceId = added.data.device.device_id;

  const software = await call(`/api/devices/${deviceId}/software`, {
    method: "POST",
    body: { name: "Google Chrome", version: "126.0", vendor: "Google" },
    cookie: alice
  });
  assert.equal(software.status, 201);
  const softwareId = software.data.software.software_id;

  const edit = await call(`/api/software/${softwareId}`, {
    method: "PUT",
    body: { name: "Changed", version: "0.1" },
    cookie: bob
  });
  assert.equal(edit.status, 404);

  const remove = await call(`/api/software/${softwareId}`, {
    method: "DELETE",
    cookie: bob
  });
  assert.equal(remove.status, 404);

  const ownEdit = await call(`/api/software/${softwareId}`, {
    method: "PUT",
    body: { name: "Google Chrome", version: "127.0", vendor: "Google" },
    cookie: alice
  });
  assert.equal(ownEdit.status, 200);
  assert.equal(ownEdit.data.software.version, "127.0");
});

test("Risk score only covers the logged-in user's devices", async () => {
  const aliceDevices = await call("/api/devices", { cookie: alice });
  const aliceReport = await call("/api/risk-score", { cookie: alice });
  assert.equal(aliceReport.status, 200);
  assert.equal(aliceReport.data.devices.length, aliceDevices.data.devices.length);

  const bobReport = await call("/api/risk-score", { cookie: bob });
  assert.equal(bobReport.status, 200);
  assert.deepEqual(bobReport.data.devices, []);
});

test("POST device rejects missing fields", async () => {
  const { status, data } = await call("/api/devices", {
    method: "POST",
    body: { name: "Test Laptop", device_type: "Laptop" },
    cookie: alice
  });

  assert.equal(status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "All device fields are required");
});

test("PUT device rejects invalid ID", async () => {
  const { status, data } = await call("/api/devices/invalid-id", {
    method: "PUT",
    body: laptop,
    cookie: alice
  });

  assert.equal(status, 400);
  assert.equal(data.message, "Invalid device ID");
});

test("POST software rejects missing version", async () => {
  const { status, data } = await call(`/api/devices/${UNKNOWN_ID}/software`, {
    method: "POST",
    body: { name: "Google Chrome", vendor: "Google" },
    cookie: alice
  });

  assert.equal(status, 400);
  assert.equal(data.message, "Valid software name and version are required");
});

test("GET software returns 404 for an unknown device", async () => {
  const { status, data } = await call(`/api/devices/${UNKNOWN_ID}/software`, {
    cookie: alice
  });

  assert.equal(status, 404);
  assert.equal(data.success, false);
  assert.equal(data.message, "Device not found");
});

test("Over-long device fields are rejected with 400 (D-01)", async () => {
  const atLimit = await call("/api/devices", {
    method: "POST",
    body: { ...laptop, name: "x".repeat(100) },
    cookie: alice
  });
  assert.equal(atLimit.status, 201);

  const tooLong = await call("/api/devices", {
    method: "POST",
    body: { ...laptop, name: "x".repeat(101) },
    cookie: alice
  });
  assert.equal(tooLong.status, 400);
  assert.equal(tooLong.data.message, "One or more device fields are too long");

  const editTooLong = await call(`/api/devices/${atLimit.data.device.device_id}`, {
    method: "PUT",
    body: { ...laptop, os_version: "1".repeat(101) },
    cookie: alice
  });
  assert.equal(editTooLong.status, 400);
});

test("Over-long software fields are rejected with 400 (D-01)", async () => {
  const added = await call("/api/devices", {
    method: "POST",
    body: laptop,
    cookie: alice
  });
  const deviceId = added.data.device.device_id;
  const addSoftware = body =>
    call(`/api/devices/${deviceId}/software`, { method: "POST", body, cookie: alice });

  assert.equal((await addSoftware({ name: "s".repeat(150), version: "1" })).status, 201);
  assert.equal((await addSoftware({ name: "s".repeat(151), version: "1" })).status, 400);
  assert.equal((await addSoftware({ name: "App", version: "1".repeat(100) })).status, 201);
  assert.equal((await addSoftware({ name: "App", version: "1".repeat(101) })).status, 400);
});

test("Detected device saves its browser as software (Detect this computer)", async () => {
  const added = await call("/api/devices", {
    method: "POST",
    body: {
      ...laptop,
      os_name: "macOS",
      os_version: "26.6.2",
      source: "detected",
      browser: { name: "Google Chrome", version: "141.0.7390.55" }
    },
    cookie: alice
  });
  assert.equal(added.status, 201);
  assert.equal(added.data.device.source, "detected");
  assert.equal(added.data.software.name, "Google Chrome");
  assert.equal(added.data.software.source, "detected");

  const deviceId = added.data.device.device_id;
  const list = await call(`/api/devices/${deviceId}/software`, { cookie: alice });
  assert.equal(list.status, 200);
  assert.equal(list.data.software.length, 1);
  assert.equal(list.data.software[0].version, "141.0.7390.55");
  assert.equal(list.data.software[0].source, "detected");

  const devices = await call("/api/devices", { cookie: alice });
  const device = devices.data.devices.find(d => d.device_id === deviceId);
  assert.equal(device.source, "detected");
});

test("Devices added without a source are manual and have no software", async () => {
  const added = await call("/api/devices", {
    method: "POST",
    body: laptop,
    cookie: alice
  });
  assert.equal(added.status, 201);
  assert.equal(added.data.device.source, "manual");
  assert.equal(added.data.software, null);
});

test("Invalid source or browser is rejected and nothing is saved", async () => {
  const before = await call("/api/devices", { cookie: bob });

  for (const source of ["extension", "unknown", 5]) {
    const result = await call("/api/devices", {
      method: "POST",
      body: { ...laptop, source },
      cookie: bob
    });
    assert.equal(result.status, 400, `source ${source}`);
    assert.equal(result.data.message, "Source must be manual or detected");
  }

  const badBrowsers = [
    null,
    "Chrome",
    { name: "Chrome" },
    { name: "", version: "1" },
    { name: "Chrome", version: "1".repeat(101) }
  ];
  for (const browser of badBrowsers) {
    const result = await call("/api/devices", {
      method: "POST",
      body: { ...laptop, source: "detected", browser },
      cookie: bob
    });
    assert.equal(result.status, 400, `browser ${JSON.stringify(browser)}`);
    assert.equal(result.data.message, "Browser needs a valid name and version");
  }

  const after = await call("/api/devices", { cookie: bob });
  assert.equal(after.data.devices.length, before.data.devices.length);
});

test("Score history starts empty while scores are Can't check", async () => {
  const cookie = await signUpAndLogIn("dana");

  await call("/api/devices", { method: "POST", body: laptop, cookie });

  const history = await call("/api/score-history", { cookie });
  assert.equal(history.status, 200);
  assert.equal(history.data.days, 30);
  assert.deepEqual(history.data.snapshots, []);

  for (const days of [90, 365]) {
    const result = await call(`/api/score-history?days=${days}`, { cookie });
    assert.equal(result.status, 200);
    assert.equal(result.data.days, days);
  }
});

test("Score history rejects an unsupported range", async () => {
  for (const days of ["7", "abc", "0"]) {
    const result = await call(`/api/score-history?days=${days}`, { cookie: alice });
    assert.equal(result.status, 400, `days ${days}`);
    assert.equal(result.data.message, "days must be 30, 90 or 365");
  }
});

test("Logging out ends access to inventory", async () => {
  const cookie = await signUpAndLogIn("carol");

  const logout = await call("/api/auth/logout", { method: "POST", cookie });
  assert.equal(logout.status, 200);

  const after = await call("/api/devices", { cookie });
  assert.equal(after.status, 401);
});
