
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

## Development Limitations

Authentication is not yet implemented.
Some endpoints currently use a fixed development test account.
The GET Devices endpoint is not yet restricted by user.

These limitations must be resolved before public deployment.
