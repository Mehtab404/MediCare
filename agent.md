# Agent Guide – MediCare

Read this before changing code. The work queue is in `task.md`. Pick the first task that isn't done, mark it `[~]`, finish it, verify it, then mark it `[x]`.

## What the app is

A patient portal for a hospital. Patients register, log in, browse doctors, book appointments (Normal or Tatkal), and view, reschedule, or cancel their bookings.

## Stack

| Part | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind, shadcn/ui, react-router 6, @tanstack/react-query |
| Backend | Node + Express (TypeScript, run with `tsx`) in `server/` |
| Database | PostgreSQL (`pg` driver, plain SQL, no ORM) |
| Auth | bcrypt password hashes, JWT in an httpOnly cookie named `medicare_session` |
| Hosting | Render: one web service plus one Render Postgres instance |

## Layout

```
server/
  index.ts          Express app: API routes + static dist/ in production; migrates and seeds on start
  config.ts         Reads and checks environment variables
  db.ts             pg Pool and query helper
  auth.ts           JWT cookie helpers and requireAuth middleware
  routes/           auth.ts, doctors.ts, appointments.ts
  lib/dates.ts      Slot list and date/time rules shared by the routes
  lib/http.ts       HttpError and Postgres error helpers
  migrations/       Numbered .sql files, applied in order
  migrate.ts        Migration runner (also: npm run db:migrate)
  seed.ts           Seeds doctors (idempotent; auto-runs when the table is empty)
src/
  lib/api.ts        fetch wrapper; throws ApiError with the server message
  lib/format.ts     Date, time and initials formatting
  contexts/         AuthContext
  components/       App components (RouteGuards, SlotPicker, RescheduleDialog, PageState, ...)
  components/ui/    shadcn/ui (don't edit by hand)
  pages/            One file per route
  types.ts          Shared frontend types matching API responses
render.yaml         Render Blueprint (web service + Postgres)
docker-compose.yml  Local Postgres
```

## Commands

```
docker compose up -d     Start local Postgres
npm run db:migrate       Apply migrations
npm run db:seed          Seed doctors
npm run dev              API on :3001 and Vite on :8080 (Vite proxies /api)
npm run typecheck        tsc for frontend and server
npm run lint             eslint
npm run build            Build the frontend into dist/
npm start                Production server (serves API + dist/)
```

## Rules

- **The server is the source of truth.** Booking rules (availability, dates, Tatkal, past slots, double booking, price) are enforced in `server/routes/appointments.ts`. The UI may repeat them for usability, but never relies on them.
- **SQL:** parameterized queries only (`$1, $2`). Never build SQL with string concatenation.
- **Validation:** validate every request body and query with zod at the route.
- **Ownership:** every appointment query filters by `patient_id = req.patientId`.
- **Errors:** API errors are JSON `{ "error": "message" }` with a fitting status code (400, 401, 404, 409). Don't leak stack traces.
- **Secrets:** only in `.env` (git-ignored). Add new variables to `.env.example` and `server/config.ts`.
- **Schema changes:** add a new numbered file in `server/migrations/`. Never edit a migration that has been applied.
- **Dates:** appointment dates are `YYYY-MM-DD` strings in the hospital's local time (`Asia/Kolkata`). Don't use `toISOString()` for dates.
- **No fake claims in the UI.** Don't say a payment, email, or report exists unless the code actually does it.
- **Styling:** use existing Tailwind tokens and shadcn components. Follow the patterns already used in `src/pages`.
- **Scope:** do what the task says. Note extra ideas in `task.md` instead of building them.

## Definition of done

1. `npm run typecheck`, `npm run lint`, and `npm run build` pass.
2. The behavior in the task was exercised for real (curl for API, a browser run or API calls for UI flows).
3. `task.md` is updated.
