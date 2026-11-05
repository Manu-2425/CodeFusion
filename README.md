# Cyber Buddy

**Team Code Fusion** (UNT Capstone): Akhil Saraswatula, Manu Sowsick Rama, Hasini Kanuru, Tezesh Penikelapati

Cyber Buddy helps non-technical people see how safe their devices are. It keeps an inventory of a user's devices and software, checks them against public security data, and shows one easy-to-understand risk score.

| Part | Technology | Folder |
|---|---|---|
| Web app | React + Vite | `frontend/` |
| REST API | Node.js + Express | `backend/` |
| Database | PostgreSQL | `backend/schema.sql`, `backend/migrations/` |

More detail: [`backend/README.md`](backend/README.md) (API, scoring, end-of-life check) and [`frontend/CROSS_BROWSER.md`](frontend/CROSS_BROWSER.md) (browser test results).

---

## Setup checklist

Follow these steps once on a new computer. Commands are for macOS; Windows notes are at the end of each step.

### 1. Install the tools

- [ ] **Node.js** (LTS version) from https://nodejs.org. Check with `node -v` (version 22 or newer).
- [ ] **Git**. Check with `git --version`. On a Mac, if it is missing, macOS offers to install the Command Line Tools.
- [ ] **PostgreSQL**. On a Mac, use **Postgres.app** (https://postgresapp.com) and click **Start**. On Windows, use the installer from https://www.postgresql.org/download/.

### 2. Get the code

```
cd ~/Desktop
git clone https://github.com/Manu-2425/CodeFusion.git
cd CodeFusion
```

### 3. Create the database

```
/Applications/Postgres.app/Contents/Versions/latest/bin/createdb cyberbuddy
/Applications/Postgres.app/Contents/Versions/latest/bin/psql -d cyberbuddy -f backend/schema.sql
```

`schema.sql` already includes every migration, so a new database needs nothing else. Login sessions get their own table automatically the first time the backend starts.

*Windows:* run `createdb -U postgres cyberbuddy` and `psql -U postgres -d cyberbuddy -f backend/schema.sql` from the PostgreSQL bin folder, or use pgAdmin.

### 4. Set up the backend

```
cd backend
cp .env.example .env
npm install
```

Then open `backend/.env` and set:

| Setting | Value |
|---|---|
| `SESSION_SECRET` | A long random string. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DB_HOST` | `localhost` (not your username) |
| `DB_USER` | Your database username. With Postgres.app this is your Mac username (`whoami`). On Windows it is usually `postgres` |
| `DB_PASSWORD` | Only if your PostgreSQL needs one (remove the `#` in front) |

Check the database connection:

```
node -e "require('dotenv').config(); require('./db').query('SELECT 1').then(() => { console.log('DB OK'); process.exit(0) }).catch(e => { console.error('DB ERROR:', e.message); process.exit(1) })"
```

It should print **DB OK**.

### 5. Set up the frontend

```
cd ../frontend
cp .env.example .env
npm install
```

The default `BACKEND_URL=http://localhost:5001` works as long as the backend uses port 5001.

### 6. Run the app

Use two terminals:

| Terminal | Commands | Wait for |
|---|---|---|
| 1 (backend) | `cd backend` then `npm start` | `Cyber Buddy server running on port 5001` |
| 2 (frontend) | `cd frontend` then `npm run dev` | `Local: http://localhost:5173/` |

Open **http://localhost:5173** in Chrome. Sign up, then try **Detect this computer**.

### 7. Run the tests

With the backend running:

```
cd backend
node --test tests/*.test.js
cd ../frontend
npm test
```

Expected: **57** backend tests and **16** frontend tests, all passing.

---

## Updating an existing setup

After pulling new code:

```
git checkout main
git pull
cd backend && npm install
cd ../frontend && npm install
```

If the pull added a new file in `backend/migrations/`, run it once on your database, for example:

```
/Applications/Postgres.app/Contents/Versions/latest/bin/psql -d cyberbuddy -f backend/migrations/002_score_snapshots.sql
```

Migrations are safe to run more than once. Then restart the backend.

| Migration | Adds |
|---|---|
| `001_add_source.sql` | `source` column on devices and software (Detect this computer) |
| `002_score_snapshots.sql` | `score_snapshots` table (score history) |

---

## Working on a feature

1. Start from the latest main: `git checkout main`, `git pull`, then `git checkout -b <feature-name>`.
2. Commit with your own name and email so GitHub credits you.
3. Push and open a pull request into `main`. Before uploading on the GitHub website, check that every file path starts with `backend/` or `frontend/` (no extra folder) and that the target branch is not `main`.
4. Run all tests and try the feature in the browser before merging. Use **Squash and merge**.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module 'express'` (or another package) | Run `npm install` in that folder |
| `SESSION_SECRET is missing from .env` | Add `SESSION_SECRET=...` to `backend/.env` (step 4) |
| `getaddrinfo ENOTFOUND <name>` | `DB_HOST` must be `localhost`; your username goes in `DB_USER` |
| `ECONNREFUSED ... 5432` | PostgreSQL is not running. Open Postgres.app and click Start |
| `role "..." does not exist` | `DB_USER` is wrong. Use the output of `whoami` with Postgres.app |
| `EADDRINUSE` on port 5001 | The backend is already running elsewhere. Run `lsof -ti :5001 \| xargs kill`, then `npm start` |
| Frontend says port 5173 is in use | It picks another port (for example 5174). Use the address it prints |
| Sign-up or saving fails with a server error after a pull | A new migration was not run (see "Updating an existing setup") |
| Scores say "Can't check" | Normal for Linux, ChromeOS and software. For macOS or Windows, check the backend terminal for "End-of-life lookup failed" (internet needed) |

---

## Repository

https://github.com/Manu-2425/CodeFusion
