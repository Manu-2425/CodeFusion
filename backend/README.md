
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
