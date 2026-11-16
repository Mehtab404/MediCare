# MediCare

A hospital patient portal. Patients create an account, browse doctors, book Normal or Tatkal appointments, and view, reschedule, or cancel their bookings. All data is stored in PostgreSQL.

## Features

- **Patient accounts:** registration and login with bcrypt-hashed passwords and an httpOnly session cookie. Every page except login and register requires a session.
- **Doctors:** searchable list with specialization and "Available only" filters, plus profile pages. Doctors marked unavailable can't be booked.
- **Booking:** Normal bookings up to 90 days ahead. Tatkal bookings are next day only, +₹300. Slots that are already booked or have passed are disabled. The server enforces every rule and calculates the price.
- **Appointments:** upcoming and past/cancelled lists, reschedule dialog, cancel with confirmation, printable booking receipt.
- **Dashboard:** stats and upcoming visits calculated from the patient's own appointments.

Fees are paid at the hospital reception. The app doesn't take online payments.

## Tech stack

| Part | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query |
| Backend | Node.js, Express 5, TypeScript (run with `tsx`), zod validation |
| Database | PostgreSQL 17 (`pg`, plain SQL migrations) |
| Hosting | Render (web service + Render Postgres) |

## Run locally

Requirements: Node.js 22.12 or newer, and Docker (for Postgres). You can also use your own Postgres and skip Docker.

```bash
git clone https://github.com/Mehtab404/MediCare.git
cd MediCare
npm install

# 1. Configure environment
cp .env.example .env            # Windows PowerShell: Copy-Item .env.example .env
# Edit .env and set JWT_SECRET to a long random string:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 2. Start Postgres
docker compose up -d

# 3. Create tables and add the doctors
npm run db:migrate
npm run db:seed

# 4. Start the API (port 3001) and the web app (port 8080)
npm run dev
```

Open http://localhost:8080 and click **Register** to create a patient account.

The server also applies migrations every time it starts, and seeds the doctors if the table is empty. You only need step 3 if you want to run those steps yourself.

## Environment variables

| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `JWT_SECRET` | Yes | Secret for signing session cookies. At least 32 characters in production. |
| `DATABASE_SSL` | No | `true` if the database needs SSL (for example, Render's external URL). Default `false`. |
| `PORT` | No | Server port. Default `3001`. Render sets this for you. |
| `NODE_ENV` | No | `production` turns on secure cookies. |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API with auto-reload plus Vite dev server. Vite proxies `/api` to the API. |
| `npm run build` | Builds the frontend into `dist/` |
| `npm start` | Production server: API plus the built frontend from `dist/` |
| `npm run db:migrate` | Applies new files from `server/migrations/` |
| `npm run db:seed` | Adds or updates the default doctors |
| `npm run typecheck` | TypeScript check for frontend and server |
| `npm run lint` | ESLint |

## API

All responses are JSON. Errors look like `{ "error": "message" }`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create an account and log in |
| POST | `/api/auth/login` | – | Log in |
| POST | `/api/auth/logout` | – | Log out |
| GET | `/api/auth/me` | Session | Current patient |
| GET | `/api/doctors` | – | All doctors |
| GET | `/api/doctors/:id` | – | One doctor |
| GET | `/api/doctors/:id/slots?date=YYYY-MM-DD` | Session | Booking window and slot status for a date |
| GET | `/api/appointments` | Session | The patient's appointments |
| GET | `/api/appointments/:id` | Session | One of the patient's appointments |
| POST | `/api/appointments` | Session | Book (`doctorId`, `date`, `time`, `bookingType`) |
| PATCH | `/api/appointments/:id/reschedule` | Session | Move to a new `date` and `time` |
| PATCH | `/api/appointments/:id/cancel` | Session | Cancel |
| GET | `/api/health` | – | Health check (also checks the database) |

Dates and slots use the hospital's time zone (Asia/Kolkata).

## Deploy to Render

The repository includes a `render.yaml` Blueprint that creates a Postgres database and a web service and connects them.

1. In the Render Dashboard, choose **New > Blueprint** and select this repository.
2. Render creates `medicare-db` and `medicare`, generates `JWT_SECRET`, and sets `DATABASE_URL`.
3. On first start the server creates the tables and seeds the doctors.

To set up an existing web service by hand instead:

- **Build command:** `npm ci --include=dev && npm run build`
- **Start command:** `npm start`
- **Environment:** `NODE_ENV=production`, `DATABASE_URL` (the Render Postgres *internal* URL), `JWT_SECRET`
- **Health check path:** `/api/health`

## Project structure

```
server/            Express API, migrations, seed script
src/pages/         One component per route
src/components/    App components (components/ui is shadcn/ui)
src/contexts/      Auth context
src/lib/           API client and formatting helpers
task.md            Work list
agent.md           Guide for contributors and coding agents
```
