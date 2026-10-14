const { test } = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL = "http://localhost:5001";

test("Health API returns OK", async () => {
  const response = await fetch(`${BASE_URL}/api/health`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.status, "OK");
});

test("GET devices returns a device list", async () => {
  const response = await fetch(`${BASE_URL}/api/devices`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.devices));
});

test("POST device rejects missing fields", async () => {
  const response = await fetch(`${BASE_URL}/api/devices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Laptop",
      device_type: "Laptop"
    })
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "All device fields are required");
});

test("PUT device rejects invalid ID", async () => {
  const response = await fetch(`${BASE_URL}/api/devices/invalid-id`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Laptop",
      device_type: "Laptop",
      os_name: "Windows",
      os_version: "11"
    })
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.message, "Invalid device ID");
});

test("POST software rejects missing version", async () => {
  const deviceId = "00000000-0000-4000-8000-000000000000";

  const response = await fetch(
    `${BASE_URL}/api/devices/${deviceId}/software`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Google Chrome",
        vendor: "Google"
      })
    }
  );

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(
    data.message,
    "Valid software name and version are required"
  );
});


test("GET software returns 404 for an unknown device", async () => {
  const deviceId = "00000000-0000-4000-8000-000000000000";

  const response = await fetch(
    `${BASE_URL}/api/devices/${deviceId}/software`
  );

  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.success, false);
  assert.equal(data.message, "Device not found");
});
