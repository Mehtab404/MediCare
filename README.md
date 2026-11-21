# MediCare

A hospital patient portal. Patients create an account, browse doctors, book Normal or Tatkal appointments, and view, reschedule, or cancel their bookings. All data is stored in PostgreSQL.

**Live demo:** https://medicare-84qx.onrender.com/

> Hosted on Render's free plan. The first load after a period of inactivity can take 30 to 60 seconds. Use fake data only: the demo database is not meant for real patient information.

## Contents

- [Tech stack](#tech-stack)
- [Features](#features)
- [Run locally](#run-locally)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [API](#api)
- [Email](#email)
- [Deploy to Render](#deploy-to-render)
- [Project structure](#project-structure)
- [Contributing](#contributing)

## Tech stack

| Part | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query |
| Backend | Node.js, Express 5, TypeScript (run with `tsx`), zod validation |
| Database | PostgreSQL 17 (`pg`, plain SQL migrations) |
| Hosting | Render (web service + Render Postgres) |

## Features

- **Patient accounts:** registration and login with bcrypt-hashed passwords and an httpOnly session cookie. Every page except login and register requires a session.
- **Doctors:** searchable list with specialization and "Available only" filters, plus profile pages. Doctors marked unavailable can't be booked.
- **Booking:** Normal bookings up to 90 days ahead. Tatkal bookings are next day only, +₹300. Slots that are already booked or have passed are disabled. The server enforces every rule and calculates the price.
- **Appointments:** upcoming and past/cancelled lists, reschedule dialog, cancel with confirmation, printable booking receipt.
- **Dashboard:** stats and upcoming visits calculated from the patient's own appointments.
- **Roles:** three kinds of account. Patients register themselves. Doctors and admins are created by an admin.
  - **Doctor portal (`/doctor`):** turn bookings on or off, see their own patients, open a visit to read the patient's health profile, write a diagnosis, notes and prescription, and mark each visit as completed or no-show once its slot has started.
  - **Admin console (`/admin`):** overview numbers, add and edit doctors (including an optional bio and qualifications), switch availability, give a doctor a login, list and cancel any upcoming appointment, and list all accounts. Admins can't read patients' health profiles or visit records.
- **Health profile (`/profile`):** each patient keeps date of birth, blood group, allergies, long-term conditions, current medicines and an emergency contact. A doctor sees it only for an appointment they hold with that patient, and not for cancelled ones.
- **Visit summary (`/records/:id`):** once a doctor marks a visit completed, the patient sees the diagnosis, notes, prescription and follow-up, and can print or save it as a PDF through the browser. The copy says it isn't signed by the doctor. Drafts stay private until the visit is completed.
- **Reviews:** a patient can review each completed visit once (1 to 5 stars and an optional comment). Doctor ratings are the average of real reviews. Reviews are public and show the reviewer's first name only.
- **Email notifications:** a patient adds an email on the Health Profile page and confirms it through a link. A confirmed address gets a message when they book, reschedule or cancel (including a cancellation by the hospital), and a reminder when an appointment is within 24 hours. Nothing is sent to an unconfirmed address, and removing the email stops everything. See [Email](#email).
- **Passwords:** a patient with a confirmed email can reset a forgotten password from the login page (a link that works once, for one hour). Any account can change its own password from the **Password** link in the header. Changing or resetting a password signs out every other device, and a confirmed address gets a "your password was changed" notice. Doctors and admins have no email, so an admin resets their password from the Users tab. Admins can't reset a patient's password, because that would let them read the patient's records.

Fees are paid at the hospital's billing counter. The app doesn't take online payments, and it doesn't record whether a fee has been paid.

**Privacy by design:** admins can't read patients' health profiles or visit records and can't reset a patient's password. A doctor sees a patient's health profile only for an appointment they hold with that patient.

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

Open http://localhost:8080 and click **Register** to create a patient account. To use the admin console, set `ADMIN_USER_ID` and `ADMIN_PASSWORD` in `.env` before starting the server (see below), then log in with them.

The server also applies migrations every time it starts, and seeds the doctors if the table is empty. You only need step 3 if you want to run those steps yourself.

## Environment variables

| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `JWT_SECRET` | Yes | Secret for signing session cookies. At least 32 characters in production. |
| `DATABASE_SSL` | No | `true` if the database needs SSL (for example, Render's external URL). Default `false`. |
| `PORT` | No | Server port. Default `3001`. Render sets this for you. |
| `NODE_ENV` | No | `production` turns on secure cookies. |
| `ADMIN_USER_ID` | No | With `ADMIN_PASSWORD`, creates the first admin account on server start if that User ID doesn't exist. |
| `ADMIN_PASSWORD` | No | Password for that admin (8+ characters). Only used when the account is created. |
| `SMTP_HOST` | No | Mail server. Without it, emails are printed to the server log in development and not sent in production. |
| `SMTP_PORT` | No | Default `587` (STARTTLS). |
| `SMTP_SECURE` | No | `true` for port 465. Default `false`. |
| `SMTP_USER`, `SMTP_PASSWORD` | No | Mail server login. Set both or neither. |
| `EMAIL_FROM` | With `SMTP_HOST` | Sender, for example `MediCare <no-reply@yourdomain.com>`. |
| `APP_URL` | No | Public address of the site, used for links in emails. Defaults to `http://localhost:8080`, or the service URL on Render. |

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
| POST | `/api/auth/forgot-password` | – | Email a reset link (`identifier`: User ID or confirmed email). Same answer whether or not the account exists |
| POST | `/api/auth/reset-password` | – | Set a new password from the emailed link (`token`, `password`) |
| POST | `/api/auth/change-password` | Session | Change your own password (`currentPassword`, `newPassword`) |
| GET | `/api/auth/me` | Session | Current account, including its `role` |
| GET | `/api/doctors` | – | All doctors |
| GET | `/api/doctors/:id` | – | One doctor |
| GET | `/api/doctors/:id/slots?date=YYYY-MM-DD` | Session | Booking window and slot status for a date |
| GET | `/api/appointments` | Patient | The patient's appointments |
| GET | `/api/appointments/:id` | Patient | One of the patient's appointments |
| POST | `/api/appointments` | Patient | Book (`doctorId`, `date`, `time`, `bookingType`) |
| PATCH | `/api/appointments/:id/reschedule` | Patient | Move to a new `date` and `time` |
| PATCH | `/api/appointments/:id/cancel` | Patient | Cancel |
| GET | `/api/appointments/:id/record` | Patient | Visit summary and the patient's own review (completed visits only) |
| POST | `/api/appointments/:id/review` | Patient | Review a completed visit (`rating` 1-5, optional `comment`), once per visit |
| GET, PUT | `/api/profile` | Patient | Read or save the patient's own health profile |
| GET | `/api/account` | Patient | Notification email, whether it is confirmed, and whether the server can send email |
| PUT, DELETE | `/api/account/email` | Patient | Set the address and send a confirmation link / remove it |
| POST | `/api/account/email/verify` | – | Confirm an address with the token from the email (single use, 24 hours) |
| GET | `/api/doctors/:id/reviews` | – | Newest 50 reviews for a doctor (first names only) |
| GET | `/api/doctor/me` | Doctor | The doctor's own record |
| PATCH | `/api/doctor/availability` | Doctor | Accept or pause bookings (`available`) |
| GET | `/api/doctor/appointments?date=` | Doctor | The doctor's appointments, with patient names |
| GET | `/api/doctor/appointments/:id` | Doctor | One appointment with the patient's health profile and saved record |
| PUT | `/api/doctor/appointments/:id/record` | Doctor | Save diagnosis, notes, follow-up and prescription (after the slot has started) |
| PATCH | `/api/doctor/appointments/:id/status` | Doctor | Mark a started visit `completed` or `no_show` |
| GET | `/api/admin/stats` | Admin | Counts for the overview |
| GET, POST | `/api/admin/doctors` | Admin | List doctors / add one (optionally with a login) |
| PATCH | `/api/admin/doctors/:id` | Admin | Edit a doctor or change availability |
| POST | `/api/admin/doctors/:id/account` | Admin | Create a login for a doctor |
| GET | `/api/admin/appointments?date=&doctorId=&status=` | Admin | All appointments |
| PATCH | `/api/admin/appointments/:id/cancel` | Admin | Cancel an upcoming appointment |
| GET | `/api/admin/users` | Admin | All accounts |
| POST | `/api/admin/users/:id/password` | Admin | Set a new password for a doctor or another admin (not patients) |
| GET | `/api/health` | – | Health check (also checks the database) |

Dates and slots use the hospital's time zone (Asia/Kolkata).

## Email

Emails are plain text and go out through SMTP, so any provider that offers SMTP works (Resend, SendGrid, Brevo, Gmail with an app password, or your hospital's own mail server).

| Situation | What happens |
|---|---|
| `SMTP_HOST` set | Emails are sent through that server. |
| No `SMTP_HOST`, development | Each email is printed to the server log, including the confirmation link. Use this to try the flow without a provider. |
| No `SMTP_HOST`, production | Nothing is sent. The Health Profile page says email isn't set up, and the server logs a warning at start. |

What gets sent, and only to a confirmed address: booking confirmed, rescheduled, cancelled by the patient, cancelled by the hospital, and a reminder when an appointment is within 24 hours. Appointments booked less than 24 hours ahead get no separate reminder. A failure to send is logged and never blocks a booking. Password reset links and "password changed" notices use the same mail setup. Without working email, patients can't reset a forgotten password.

If the only admin forgets their password and no other admin exists, there is no in-app way back in. Create a second admin account (so one can reset the other), or update the `users` table directly.

Reminders are checked every 15 minutes inside the web process. A service that sleeps when idle (Render's free plan does) can send them late or miss them, so use an always-on plan for reminders. On Render, add the `SMTP_*` and `EMAIL_FROM` variables in the service's Environment tab. They are not in `render.yaml` because the provider isn't chosen yet.

## Deploy to Render

The repository includes a `render.yaml` Blueprint that creates a Postgres database and a web service and connects them.

1. In the Render Dashboard, choose **New > Blueprint** and select this repository.
2. Render creates `medicare-db` and `medicare`, generates `JWT_SECRET`, sets `DATABASE_URL`, and asks you for `ADMIN_PASSWORD` (the first admin's password; the User ID defaults to `admin`).
3. On first start the server creates the tables, seeds the doctors and creates the admin account. Log in at the service URL with `admin` and the password you gave.
4. Optional: add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `EMAIL_FROM` in the service's Environment tab to turn on email. `APP_URL` defaults to the service's own URL, so you don't need to set it.

Things to know about Render's free plan (checked against [Render's docs](https://render.com/docs/free)):

- A free web service sleeps after 15 minutes without traffic, so the first request after a pause is slow, and appointment reminders can be late or missed.
- A free Postgres database is deleted 30 days after it is created (after a 14 day grace period) and has no backups. Use it to try the app, then move to a paid database before real patient data goes in.
- `ADMIN_PASSWORD` is asked for only when the Blueprint is first created. Changing it later in the dashboard doesn't change the admin's password, because it is only used when the account doesn't exist yet.

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

## Contributing

Read [agent.md](agent.md) first. Before opening a pull request, run `npm run typecheck` and `npm run lint`.
