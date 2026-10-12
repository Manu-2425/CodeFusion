const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcrypt");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from .env");
}

app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: "user_sessions",
      createTableIfMissing: true
    }),
    name: "cyberbuddy.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Cyber Buddy API",
    status: "Running",
    team: "Code Fusion"
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Cyber Buddy backend is running"
  });
});

// Start server

/*
 * GET /api/devices
 * Development-only endpoint to verify database access.
 * Authentication and user filtering will be added before
 * this endpoint is used by the frontend.
 */
app.get("/api/devices", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT device_id, name, device_type, os_name, os_version, risk_score FROM devices WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      devices: result.rows
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve devices"
    });
  }
});

/*
 * POST /api/devices
 * Development-only endpoint for adding devices.
 */
app.post("/api/devices", async (req, res) => {
  try {
    const { name, device_type, os_name, os_version } = req.body;

    if (
      typeof name !== "string" || !name.trim() ||
      typeof device_type !== "string" || !device_type.trim() ||
      typeof os_name !== "string" || !os_name.trim() ||
      typeof os_version !== "string" || !os_version.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All device fields are required"
      });
    }

    // Development-only test user
    const userResult = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      ["testuser@cyberbuddy.local"]
    );

    if (userResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Test user not found"
      });
    }

    const userId = userResult.rows[0].user_id;

    const result = await pool.query(
      `INSERT INTO devices
       (user_id, name, device_type, os_name, os_version)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        name.trim(),
        device_type.trim(),
        os_name.trim(),
        os_version.trim()
      ]
    );

    res.status(201).json({
      success: true,
      message: "Device added successfully",
      device: result.rows[0]
    });

  } catch (error) {
    console.error("Error adding device:", error);

    res.status(500).json({
      success: false,
      message: "Unable to add device"
    });
  }
});


/*
 * PUT /api/devices/:id
 * Development-only: edits a device belonging to the test user.
 */
app.put("/api/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, device_type, os_name, os_version } = req.body;

    const fields = { name, device_type, os_name, os_version };

    if (
      Object.values(fields).some(
        value => typeof value !== "string" || !value.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "All device fields are required"
      });
    }

    const result = await pool.query(
      `UPDATE devices
       SET name = $1,
           device_type = $2,
           os_name = $3,
           os_version = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE device_id = $5
         AND user_id = (
           SELECT user_id FROM users WHERE email = $6
         )
         AND deleted_at IS NULL
       RETURNING *`,
      [
        name.trim(),
        device_type.trim(),
        os_name.trim(),
        os_version.trim(),
        id,
        "testuser@cyberbuddy.local"
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Device updated successfully",
      device: result.rows[0]
    });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid device ID"
      });
    }

    console.error("Error updating device:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update device"
    });
  }
});


/*
 * DELETE /api/devices/:id
 * Development-only: soft-delete a device owned
 * by the local test user.
 */
app.delete("/api/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE devices
       SET deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE device_id = $1
         AND user_id = (
           SELECT user_id
           FROM users
           WHERE email = $2
         )
         AND deleted_at IS NULL
       RETURNING device_id, name`,
      [id, "testuser@cyberbuddy.local"]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Device removed successfully",
      device: result.rows[0]
    });

  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid device ID"
      });
    }

    console.error("Error removing device:", error);

    res.status(500).json({
      success: false,
      message: "Unable to remove device"
    });
  }
});


/*
 * POST /api/devices/:deviceId/software
 * Development-only Add Software API
 */
app.post("/api/devices/:deviceId/software", async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { name, version, vendor } = req.body;

    if (
      typeof name !== "string" || !name.trim() ||
      typeof version !== "string" || !version.trim() ||
      (vendor !== undefined &&
        (typeof vendor !== "string" || vendor.length > 150))
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid software name and version are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO software (device_id, name, version, vendor)
       SELECT d.device_id, $2, $3, $4
       FROM devices d
       JOIN users u ON u.user_id = d.user_id
       WHERE d.device_id = $1
         AND u.email = $5
         AND d.deleted_at IS NULL
       RETURNING *`,
      [
        deviceId,
        name.trim(),
        version.trim(),
        vendor?.trim() || null,
        "testuser@cyberbuddy.local"
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    return res.status(201).json({
      success: true,
      message: "Software added successfully",
      software: result.rows[0]
    });

  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid device ID"
      });
    }

    console.error("Error adding software:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add software"
    });
  }
});


/*
 * GET /api/devices/:deviceId/software
 * Development-only: retrieve software belonging
 * to the local test user's device.
 */
app.get("/api/devices/:deviceId/software", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const deviceResult = await pool.query(
      `SELECT d.device_id
       FROM devices d
       JOIN users u ON d.user_id = u.user_id
       WHERE d.device_id = $1
         AND u.email = $2
         AND d.deleted_at IS NULL`,
      [deviceId, "testuser@cyberbuddy.local"]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    const result = await pool.query(
      `SELECT software_id, device_id, name, version,
              vendor, match_status, risk_score
       FROM software
       WHERE device_id = $1
         AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [deviceId]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      software: result.rows
    });

  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid device ID"
      });
    }

    console.error("Error fetching software:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve software"
    });
  }
});


/*
 * PUT /api/software/:id
 * Development-only: update software owned
 * by the local test user's device.
 */
app.put("/api/software/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, version, vendor } = req.body;

    if (
      typeof name !== "string" || !name.trim() ||
      name.length > 150 ||
      typeof version !== "string" || !version.trim() ||
      version.length > 100 ||
      (vendor != null &&
        (typeof vendor !== "string" || vendor.length > 150))
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid software name and version are required"
      });
    }

    const result = await pool.query(
      `UPDATE software AS s
       SET name = $1,
           version = $2,
           vendor = $3,
           match_status = 'unverified',
           cpe_name = NULL,
           risk_score = NULL,
           updated_at = CURRENT_TIMESTAMP
       FROM devices AS d
       JOIN users AS u ON d.user_id = u.user_id
       WHERE s.software_id = $4
         AND s.device_id = d.device_id
         AND u.email = $5
         AND s.deleted_at IS NULL
         AND d.deleted_at IS NULL
       RETURNING s.*`,
      [
        name.trim(),
        version.trim(),
        vendor?.trim() || null,
        id,
        "testuser@cyberbuddy.local"
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Software not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Software updated successfully",
      software: result.rows[0]
    });

  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid software ID"
      });
    }

    console.error("Error updating software:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update software"
    });
  }
});


/*
 * DELETE /api/software/:id
 * Development-only: soft-delete software belonging
 * to the local test user's device.
 */
app.delete("/api/software/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE software AS s
       SET deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       FROM devices AS d
       JOIN users AS u ON d.user_id = u.user_id
       WHERE s.software_id = $1
         AND s.device_id = d.device_id
         AND u.email = $2
         AND s.deleted_at IS NULL
         AND d.deleted_at IS NULL
       RETURNING s.software_id, s.name`,
      [id, "testuser@cyberbuddy.local"]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Software not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Software removed successfully",
      software: result.rows[0]
    });

  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid software ID"
      });
    }

    console.error("Error removing software:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove software"
    });
  }
});


/*
 * POST /api/auth/register
 * Create a Cyber Buddy account securely.
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, display_name } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof display_name !== "string" ||
      !email.trim() ||
      !display_name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Email, password and name are required"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      display_name.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or display name"
      });
    }

    if (
      password.length < 12 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 12 characters and at most 72 UTF-8 bytes"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users
         (email, display_name, auth_provider, password_hash)
       VALUES ($1, $2, 'email', $3)
       RETURNING user_id, email, display_name, created_at`,
      [cleanEmail, display_name.trim(), passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: result.rows[0]
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account"
    });
  }
});


/*
 * POST /api/auth/login
 * Authenticate a user and create a session.
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT user_id, email, display_name, password_hash
       FROM users
       WHERE email = $1 AND auth_provider = 'email'`,
      [cleanEmail]
    );

    const user = result.rows[0];

    if (
      !user ||
      !user.password_hash ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error("Session error:", error);
        return res.status(500).json({
          success: false,
          message: "Unable to create login session"
        });
      }

      req.session.userId = user.user_id;

      req.session.save((error) => {
        if (error) {
          console.error("Session save error:", error);
          return res.status(500).json({
            success: false,
            message: "Unable to save login session"
          });
        }

        return res.status(200).json({
          success: true,
          message: "Login successful",
          user: {
            user_id: user.user_id,
            email: user.email,
            display_name: user.display_name
          }
        });
      });
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in"
    });
  }
});


/*
 * GET /api/auth/me
 * Return the currently authenticated user.
 */
app.get("/api/auth/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    const result = await pool.query(
      `SELECT user_id, email, display_name
       FROM users
       WHERE user_id = $1`,
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Session verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify session"
    });
  }
});


/*
 * POST /api/auth/logout
 * Destroy the user's authenticated session.
 */
app.post("/api/auth/logout", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }

  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to log out"
      });
    }

    res.clearCookie("cyberbuddy.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  });
});

app.listen(PORT, () => {
  console.log(`Cyber Buddy server running on port ${PORT}`);
});
