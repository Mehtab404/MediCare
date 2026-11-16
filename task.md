# MediCare - Task List

Status legend: `[ ]` todo, `[~]` in progress, `[x]` done.
Work through the tasks in order. Each task lists what "done" means.

## Decisions

- **Database:** PostgreSQL. Local development runs it in Docker (`docker-compose.yml`). Production uses Render Postgres through `DATABASE_URL`.
- **Backend:** Node + Express in TypeScript (`server/`), run with `tsx`. It serves `/api/*` and, in production, the built frontend from `dist/`. One Render web service, same origin, so there's no CORS setup.
- **Auth:** Patients register and log in. Passwords are hashed with bcrypt. The session is a JWT in an httpOnly, SameSite=Lax cookie.
- **Payments:** No payment gateway. The fee is paid at the hospital's billing counter, and the UI must not claim a payment happened. The user will decide on online payment later; nothing for it is built.

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

## Phase 4 - Full product

Roadmap agreed with the user: 1 roles and admin, 2 hospital features (profiles, prescriptions, reviews), 3 notifications and payments, 4 account security, 5 tests and CI, 6 operations.

- [x] **T14. Roles and admin (area 1)**
  - Migration `002_roles.sql`: `patients` renamed to `users` with a `role` (patient, doctor, admin); `doctors.user_id` links a doctor to a login; appointment statuses `completed` and `no_show`.
  - `requireRole` reads the role from the database on every request. Public registration always creates a patient.
  - First admin is created on start from `ADMIN_USER_ID` and `ADMIN_PASSWORD`.
  - Admin API and `/admin` page: stats, add and edit doctors, availability, doctor logins, all appointments (cancel upcoming), all users.
  - Doctor API and `/doctor` page: own availability, own appointments with patient names, mark started visits completed or no-show.
  - Verified: 45 API checks, plus doctor closing a started visit (own only, once), patient blocked from cancelling it; 18 headless-browser checks (role redirects, admin adds a doctor with a login, doctor logs in). Run against a throwaway embedded Postgres, not Docker.
  - Not done from the original description: a separate departments table (specialization serves as the department) and per-doctor working days or hours (slots are still the same 12 per day for every doctor).

- [x] **T15. Patient profile, visit records, reviews (area 2)**
  - Migration `003_records.sql`: `patient_profiles`, `visit_records`, `prescription_items`, `reviews`. Doctors get `bio` and `qualifications`. The `doctors.rating` and `doctors.reviews` columns are dropped: ratings are now the average of real reviews. The old values were made-up seed numbers.
  - Patient: `/profile` (health profile), `/records/:id` (visit summary, print or save as PDF through the browser, review form).
  - Doctor: `/doctor/visit/:id` shows the patient's profile and edits the diagnosis, notes, follow-up and up to 20 medicines. Records are editable after completing and invisible to the patient until the visit is completed. No record for no-shows or cancelled visits.
  - Admin: bio and qualifications fields on the doctor form. Admins can't read profiles or records.
  - Removed invented content from the doctor page (the shared AIIMS qualifications, "helped thousands of patients", two fake reviews). Bio and qualifications show only when an admin fills them in.
  - Verified: 87 API checks (access by role, validation, draft visibility, one review per visit, ratings and counts, public reviews expose first name only, 413 for oversized bodies); 52 headless-browser checks (profile save and reload, doctor writes a record and completes the visit, patient reads it and reviews, print layout, bio shows on the doctor page, role redirects); the 45 area-1 API checks rerun on a fresh database with all three migrations. Run against a throwaway embedded Postgres, not Docker.
  - Real bug found by the browser run: a toast covered the bottom-right action buttons on the doctor visit page. Fixed with extra bottom padding there and on the profile page.
  - Not done: downloadable reports are browser print only (no server-generated PDF). No audit log of who viewed or edited a record (planned under account security). No file or lab report uploads.
- [x] **T16. Email notifications (area 3, payments deferred)**
  - Payments stay at the billing counter by the user's choice. Wording changed from "reception" to "billing counter". No payment code, no paid/unpaid marker.
  - Migration `004_email.sql`: `users.email` and `email_verified_at`, `email_verifications` (hashed single-use tokens, 24 hour expiry), `appointments.reminder_sent_at`.
  - Patients add an email on `/profile` and confirm it through a link (`/verify-email?token=`). Only a verified address ever gets appointment mail. Changing or removing the address stops mail at once. One verified account per address. 60 second resend cooldown per account plus per-IP limits.
  - Emails (plain text): booking confirmed, rescheduled, cancelled by the patient, cancelled by the hospital (admin), and a reminder when an appointment is within 24 hours. Appointments booked less than 24 hours ahead get no reminder (the confirmation is the reminder). A mail failure is logged and never fails the booking.
  - Provider: plain SMTP through nodemailer (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `APP_URL`). No provider chosen yet. Without `SMTP_HOST`, development prints emails to the server log, and production sends nothing and tells the patient email isn't set up.
  - Verified: 71 API checks in log mode (verification rules, who gets mail and who doesn't, content of each email, address takeover blocked, stale and expired links, reminders incl. restart safety); 17 checks against a local SMTP server with a login (From/To/auth, mail server down gives a friendly 502 and an immediate retry, bookings still succeed, email-off mode); 33 headless-browser checks (dashboard prompt, add and confirm, link opened logged out, reuse fails, change, resend cooldown, remove, wording). All earlier suites rerun on a fresh database: 45 + 87 API, 18 + 52 browser.
  - Not verified: sending through a real provider, and how the emails look in real mail clients. Not done: HTML emails, SMS or WhatsApp, a doctor-facing email, and per-event opt-outs (removing the email stops everything).
  - Reminders run inside the web process every 15 minutes. On Render's free plan the service sleeps when idle, so reminders can be late or missed until it runs on an always-on plan or an external scheduler calls it (see T19).
- [ ] **T16b. Online payments** (deferred by the user; decide the method later)
- [x] **T17a. Password reset and change (first part of area 4)**
  - Migration `005_password_reset.sql`: `users.password_changed_at`, `password_resets` (hashed single-use tokens, 1 hour).
  - Forgot password by User ID or confirmed email. The answer is identical whether or not the account exists. Only confirmed addresses get a link, one link per minute per account, a new link kills the old one. Change password for any role (needs the current one). A "password changed" email goes to a confirmed address.
  - Every request checks the session cookie against the database: a password change or reset signs out all other sessions at once (cookies carry a millisecond issue time for this).
  - Admins can set a new password for doctors and other admins (they have no email). Not for patients: that would let an admin read their health records.
  - Verified: 74 API checks, 41 headless-browser checks. All earlier suites rerun with the new session check (see T16/T15/T14 numbers).
  - Not done: forced password change after an admin reset (the admin knows the temporary password until the person changes it), account lockout after repeated wrong passwords (only a per-IP limit), and recovery when the only admin forgets their password.
- [ ] **T17b. Audit log and account deactivation** (rest of area 4): who viewed or edited health records, password and role changes, deactivating an account.
- [ ] **T18. Automated tests and CI** (area 5)
- [ ] **T19. Staging deploy, monitoring, backups** (area 6)

---

## Follow-ups (not started)

- `bcryptjs` caps passwords at 72 bytes; longer passwords are compared on the first 72 bytes only.
- No admin screens: doctors and availability are changed in the database or `server/seed.ts`.
- The JS bundle is 725 kB (Vite warns above 500 kB). Route-level code splitting would reduce it.
- `npm audit` reports advisories in existing dependencies; review before production.
- `lovable-tagger` (dev-only Vite plugin from the Lovable template) is still installed.
- Admins can't change roles or deactivate accounts yet.
- Admin and doctor pages have no automated tests; they were checked by hand-written scripts that are not in the repo.
- Records have no edit history. A doctor's correction overwrites the previous text.
- Reviews can't be edited or removed by patients, and there's no admin moderation.
- Emails can't be sent to doctors, and patients can't pick which emails they get.
- A patient who requests a confirmation link for someone else's address makes the server send that person one confirmation email (rate limited, nothing else is sent until they follow it).
