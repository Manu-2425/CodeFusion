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
    ["GET", "/api/risk-score"]
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

test("Logging out ends access to inventory", async () => {
  const cookie = await signUpAndLogIn("carol");

  const logout = await call("/api/auth/logout", { method: "POST", cookie });
  assert.equal(logout.status, 200);

  const after = await call("/api/devices", { cookie });
  assert.equal(after.status, 401);
});
