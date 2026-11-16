# MediCare - Task List

Status legend: `[ ]` todo, `[~]` in progress, `[x]` done.
Work through the tasks in order. Each task lists what "done" means.

## Decisions

- **Database:** PostgreSQL. Local development runs it in Docker (`docker-compose.yml`). Production uses Render Postgres through `DATABASE_URL`.
- **Backend:** Node + Express in TypeScript (`server/`), run with `tsx`. It serves `/api/*` and, in production, the built frontend from `dist/`. One Render web service, same origin, so there's no CORS setup.
- **Auth:** Patients register and log in. Passwords are hashed with bcrypt. The session is a JWT in an httpOnly, SameSite=Lax cookie.
- **Payments:** No payment gateway. The fee is payable at the hospital, and the UI must not claim a payment happened.

---

## Phase 1 - Backend and database

- [x] **T1. Project setup**
  - Move build-only packages (`vite`, `typescript`, `@vitejs/plugin-react-swc`) to `devDependencies`. Rename the package to `medicare`.
  - Add the server dependencies: `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `express-rate-limit`, `tsx`, `concurrently`.
  - Add `.env.example`, ignore `.env`, and add `docker-compose.yml` for Postgres.
  - Scripts: `dev` (API + Vite together), `dev:server`, `build`, `start`, `db:migrate`, `db:seed`, `typecheck`.
  - Vite dev server proxies `/api` to the Express port.
  - Done when `npm install` succeeds and `docker compose up -d` starts Postgres.

- [x] **T2. Database schema, migrations, and seed**
  - Tables: `patients`, `doctors`, `appointments`.
  - A unique index stops two active bookings for the same doctor, date, and time.
  - A small migration runner with a `schema_migrations` table.
  - A seed script that inserts the six existing doctors and is safe to run twice.
  - Done when `npm run db:migrate` and `npm run db:seed` work on an empty database.

- [x] **T3. Express server and auth API**
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
  - Input validated with zod. Errors return JSON `{ error }` with correct status codes.
  - `requireAuth` middleware for protected routes. Login and register are rate limited.
  - Done when register -> login -> me -> logout works against the running server.

- [x] **T4. Doctors and appointments API**
  - `GET /api/doctors`, `GET /api/doctors/:id`, `GET /api/doctors/:id/slots?date=`.
  - `GET /api/appointments`, `GET /api/appointments/:id`, `POST /api/appointments`, `PATCH /api/appointments/:id/cancel`, `PATCH /api/appointments/:id/reschedule`.
  - Rules enforced on the server:
    - The doctor must be available.
    - The date can't be in the past, and Tatkal bookings must be for tomorrow.
    - Today's slots that have already passed can't be booked.
    - A slot can't be double booked, and a patient can't hold two bookings at the same time.
    - The amount is calculated by the server (fee, +300 for Tatkal).
    - Patients can only see and change their own appointments.
  - Done when each rule is checked with a request that should fail and one that should succeed.

## Phase 2 - Frontend on real data

- [x] **T5. API client, auth context, route protection**
  - `src/lib/api.ts` (fetch wrapper) and `src/contexts/AuthContext.tsx`.
  - A `ProtectedRoute` around every page except login and register. A logged-in user visiting `/` goes to the dashboard.
  - `Login` calls the API. New `Register` page replaces the dead "Contact Admin" link.
  - `Header` shows the real patient name and logs out through the API.
  - Remove all `localStorage` auth.

- [x] **T6. Doctors pages use the API**
  - `Doctors`, `DoctorProfile`, and the Dashboard "Top Doctors" list load from `/api/doctors` with react-query, with loading and error states.
  - Remove `src/data/doctors.ts` (move the `Doctor` type to `src/types.ts`).
  - Unavailable doctors show a disabled "Book" button.
  - Replace the dead "Filters" button with an "Available only" toggle.

- [x] **T7. Booking flow**
  - `Booking` posts to the API and redirects to `/confirmation/:id`.
  - Dates come from the server in hospital time, not the browser's UTC (`toISOString` bug).
  - Past slots for today and slots already booked are disabled.
  - Unavailable doctors can't be booked.
  - Server errors are shown in a toast.

- [x] **T8. Confirmation page**
  - Route `/confirmation/:id` loads the appointment from the API (removes the unsafe `JSON.parse` of `localStorage`).
  - Honest wording: "Pay at hospital reception", no claim that a payment or email happened.
  - "Print / Save Receipt" opens the browser print dialog.

- [x] **T9. Appointments page**
  - Lists the patient's real appointments, split into upcoming and past/cancelled.
  - "Cancel" asks for confirmation, then cancels. "Reschedule" opens a dialog to pick a new date and slot.
  - "View Details" opens `/confirmation/:id`.

- [x] **T10. Dashboard on real data**
  - Stats are calculated from the patient's appointments (upcoming count, next date, total visits, doctors consulted).
  - The upcoming list shows real appointments with an empty state.
  - Remove the dead "Download Reports" button and the fake "Pending Reports" stat.

- [x] **T11. Small fixes**
  - `NotFound` uses a router `Link` instead of a full page reload.
  - Update the copyright year on the login page.
  - Fix the 3 existing ESLint errors (`command.tsx`, `textarea.tsx`, `tailwind.config.ts`).

## Phase 3 - Docs and checks

- [x] **T12. README and deployment**
  - Complete local setup steps, environment variables, scripts, API summary.
  - Render instructions and a `render.yaml` Blueprint (Postgres + web service).
  - Server migrates and seeds doctors on start when the table is empty.

- [x] **T13. Verification**
  - `npm run typecheck`, `npm run lint` (0 errors, 7 existing shadcn warnings), and `npm run build` pass.
  - API check: 35 requests covering auth, every booking rule, ownership, reschedule and cancel. All pass.
  - Browser check (headless Edge): register, log in, browse doctors, book, confirmation, reschedule, cancel, log out, protected routes redirect. 30 checks pass with no console errors.
  - Fresh database: server start creates tables and seeds 6 doctors.
  - Not verified: an actual Render deploy.

---

## Follow-ups (not started)

- Doctor qualifications and patient reviews on `DoctorProfile` are still placeholder text.
- `bcryptjs` caps passwords at 72 bytes; longer passwords are compared on the first 72 bytes only.
- No admin screens: doctors and availability are changed in the database or `server/seed.ts`.
- The JS bundle is 725 kB (Vite warns above 500 kB). Route-level code splitting would reduce it.
- `npm audit` reports advisories in existing dependencies; review before production.
- `lovable-tagger` (dev-only Vite plugin from the Lovable template) is still installed.
