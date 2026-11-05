
# Cyber Buddy Backend

Team: Code Fusion
Project: Cyber Buddy – Capstone Sprint 1

## Overview

Cyber Buddy is a cybersecurity application that helps users
manage their devices, track software, and identify security risks.

This backend uses Node.js, Express, and PostgreSQL.

## Requirements

- Node.js and npm
- PostgreSQL
- GitHub repository access

## Installation

1. Open the backend folder.
2. Install dependencies:

   npm ci

3. Copy .env.example to .env.
4. Update DB_USER and any other database settings.

## Database Setup

Create a PostgreSQL database named cyberbuddy.

Run the schema:

   psql -d cyberbuddy -f schema.sql

Note: The development API currently uses a local test user.
Create that user in your local database before testing device creation.
Never use the development placeholder for real authentication.

## Start the Server

   npm start

The server uses the PORT value in .env (default: 5000).

## API Endpoints

GET     /api/health          Check backend status
GET     /api/devices         Retrieve active devices
POST    /api/devices         Add a device
PUT     /api/devices/:id     Update a device
DELETE  /api/devices/:id     Soft-delete a device

## Current Implementation

- Express server and health-check endpoint
- PostgreSQL database connection
- Users, devices, and software tables
- Basic device management REST APIs
- Soft deletion support

## Important Limitations

The current device endpoints are for local development only.
Authentication and user-specific access controls must be
completed before deployment.

Vulnerability checking, risk calculation, and software APIs
are not yet implemented.

## Security

Do not commit .env files, passwords, or node_modules to GitHub.

## Software Management APIs

The backend supports managing installed software
associated with a device.

POST   /api/devices/:deviceId/software
GET    /api/devices/:deviceId/software
PUT    /api/software/:id
DELETE /api/software/:id

Features:
- Add installed software to an existing device
- Retrieve software associated with a device
- Update software name, version, and vendor
- Soft-delete software without immediately removing its record
- Validate required fields and device/software identifiers

## Automated API Testing

The backend includes six automated API tests
using Node.js's built-in test runner.

Before running tests:
1. Start PostgreSQL.
2. Configure the local .env file.
3. Create the cyberbuddy database using schema.sql.
4. Create the development-only test user.
5. Start the Express backend.

Run tests in a separate terminal:

    node --test tests/api.test.js

The tests cover:
- Health-check endpoint
- Device retrieval
- Missing device fields
- Invalid device ID
- Missing software version
- Unknown device software retrieval

All six tests passed during local development.

## Risk Scoring

Risk scoring follows the Risk Scoring Model in the design document (DR5).
All scores run from 0 to 100, and higher means riskier.

Endpoint:

    GET /api/risk-score

Returns the overall score and level, plus a score for each device,
its operating system, and each installed program.

How scores are calculated:
- Program or OS: 10 x highest CVSS score, plus 0 if current,
  15 if outdated, or 30 if end-of-life (capped at 100)
- Device: 0.6 x highest item score + 0.4 x average item score
- Inventory: 0.6 x highest device score + 0.4 x average device score
- Checklist: No counts fully, Not sure counts as half
- Overall: 0.8 x inventory + 0.2 x checklist

Risk levels:
- 0–24 Low
- 25–49 Moderate
- 50–74 High
- 75–100 Critical

Items without vulnerability data are shown as "Can't check"
instead of being treated as safe.

Weights and levels are stored in config/scoring.json.

Run the risk-scoring tests (no database or server needed):

    node --test tests/riskScoring.test.js tests/riskReport.test.js

Current limitations:
- Vulnerability (NVD/CVE) and end-of-life data are not connected yet,
  so most items currently show "Can't check".
- The security checklist and browser extensions are not scored yet.
- Scores are calculated on request and not saved to the database.

## Development Limitations

Authentication is not yet implemented.
Some endpoints currently use a fixed development test account.
The GET Devices endpoint is not yet restricted by user.

These limitations must be resolved before public deployment.

## Database migrations

When a change needs new database columns, it comes with a file in `migrations/`.
Run each new migration once against your local database (it is safe to run again):

```
psql -d cyberbuddy -f migrations/001_add_source.sql
```

| Migration | What it adds |
|---|---|
| 001_add_source.sql | `source` column (manual, detected or extension) on `devices` and `software`, for "Detect this computer" |
| 002_score_snapshots.sql | `score_snapshots` table for score history (R15) |

`schema.sql` already includes every migration, so a brand-new database only needs `schema.sql`.

## Detect this computer: request format

`POST /api/devices` accepts two optional fields:

```
{
  "name": "Manu's MacBook",
  "device_type": "Laptop/Desktop",
  "os_name": "macOS",
  "os_version": "26.6.2",
  "source": "detected",
  "browser": { "name": "Google Chrome", "version": "141.0.7390.55" }
}
```

- `source` is `manual` (the default) or `detected`.
- If `browser` is sent, it is saved as a software item on the new device. The device and browser are saved together, or not at all.
- The response includes `device` and `software` (or `software: null` when no browser was sent).

## Score history

Whenever a device or software entry is added, edited or removed, the backend asks the scoring engine for the user's current overall score and saves a snapshot, but only when:

- the score is a real number (nothing is saved while scores are "Can't check"), and
- it is different from the user's last snapshot.

`GET /api/score-history?days=30` returns the snapshots, oldest first. `days` can be 30, 90 or 365 (default 30). Each snapshot has `overall_score`, `risk_level`, `device_scores` and `created_at`.

## Operating system end-of-life check

`services/endOfLife.js` looks up each device's operating system on [endoflife.date](https://endoflife.date) (configured in `config/sources.json`) and gives the scoring engine an age status:

| Status | Meaning | Points |
|---|---|---|
| current | Supported and on the latest update | 0 |
| outdated | Supported, but a newer update is available (macOS, iOS, iPadOS) | 15 |
| end_of_life | No longer supported | 30 |

- Checked: macOS, Windows (10 or 11), iOS, iPadOS, Android. ChromeOS and Linux stay "Can't check".
- Results are cached for 24 hours per operating system (NF6).
- If endoflife.date can't be reached, the OS stays "Can't check" and the request still succeeds (NF3).
- For testing, `END_OF_LIFE_API_URL` in `.env` can point to a local copy of the API.
