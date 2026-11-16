import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../db.ts";
import { currentUserId, requireRole } from "../auth.ts";
import { HttpError, isPgError, PG_UNIQUE_VIOLATION } from "../lib/http.ts";
import { hospitalNow, isValidDate } from "../lib/dates.ts";
import { SELECT_APPOINTMENT, toAppointment, type AppointmentRow } from "../lib/appointmentView.ts";
import { DOCTOR_COLUMNS } from "../lib/doctorSql.ts";
import { notifyAppointment } from "../lib/notifications.ts";
import type { DoctorRow } from "./doctors.ts";
import { hashPassword, passwordSchema, userIdSchema } from "../lib/users.ts";

export const adminRouter = Router();
adminRouter.use(requireRole("admin"));

const idSchema = z.coerce.number().int().positive();

function parseId(raw: string, what: string): number {
  const id = idSchema.safeParse(raw);
  if (!id.success) throw new HttpError(404, `${what} not found.`);
  return id.data;
}

// ---------- Overview ----------

adminRouter.get("/stats", async (_req, res) => {
  const now = hospitalNow();
  const hhmm = `${String(Math.floor(now.minutes / 60)).padStart(2, "0")}:${String(now.minutes % 60).padStart(2, "0")}`;

  const [roles, doctors, upcoming, today, total] = await Promise.all([
    query<{ role: string; count: number }>("SELECT role, count(*)::int AS count FROM users GROUP BY role"),
    query<{ total: number; available: number }>(
      "SELECT count(*)::int AS total, count(*) FILTER (WHERE available)::int AS available FROM doctors",
    ),
    query<{ count: number }>(
      `SELECT count(*)::int AS count FROM appointments
       WHERE status = 'booked' AND (appointment_date > $1 OR (appointment_date = $1 AND time_slot > $2))`,
      [now.date, hhmm],
    ),
    query<{ count: number }>(
      "SELECT count(*)::int AS count FROM appointments WHERE appointment_date = $1 AND status <> 'cancelled'",
      [now.date],
    ),
    query<{ status: string; count: number }>("SELECT status, count(*)::int AS count FROM appointments GROUP BY status"),
  ]);

  const byRole = Object.fromEntries(roles.rows.map((r) => [r.role, r.count]));
  const byStatus = Object.fromEntries(total.rows.map((r) => [r.status, r.count]));
  res.json({
    patients: byRole.patient ?? 0,
    doctorAccounts: byRole.doctor ?? 0,
    admins: byRole.admin ?? 0,
    doctors: doctors.rows[0].total,
    doctorsAvailable: doctors.rows[0].available,
    upcomingAppointments: upcoming.rows[0].count,
    appointmentsToday: today.rows[0].count,
    cancelled: byStatus.cancelled ?? 0,
    completed: byStatus.completed ?? 0,
    noShow: byStatus.no_show ?? 0,
  });
});

// ---------- Doctors ----------

type AdminDoctorRow = DoctorRow & { account_user_id: string | null };

const SELECT_DOCTOR = `
  SELECT ${DOCTOR_COLUMNS}, u.user_id AS account_user_id
  FROM doctors d
  LEFT JOIN users u ON u.id = d.user_id`;

function toAdminDoctor(row: AdminDoctorRow) {
  const { account_user_id, ...doctor } = row;
  return { ...doctor, accountUserId: account_user_id };
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "That value is too long.")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const doctorFields = {
  name: z.string().trim().min(3, "Please enter the doctor's name.").max(80, "Name is too long."),
  specialization: z.string().trim().min(2, "Please enter a specialization.").max(60, "Specialization is too long."),
  experience: z.number({ invalid_type_error: "Experience must be a number." }).int().min(0).max(70, "Experience must be 0-70 years."),
  location: z.string().trim().min(2, "Please enter a location.").max(80, "Location is too long."),
  fee: z.number({ invalid_type_error: "Fee must be a number." }).int().min(0).max(100000, "Fee is too high."),
  phone: optionalText(30),
  bio: optionalText(1500),
  qualifications: optionalText(800),
  email: z.string().trim().email("Please enter a valid email.").max(120).or(z.literal("")).transform((v) => v || null).nullable().optional(),
  available: z.boolean(),
};

const accountSchema = z.object({ userId: userIdSchema, password: passwordSchema });

const createDoctorSchema = z.object({
  ...doctorFields,
  available: doctorFields.available.default(true),
  account: accountSchema.optional(),
});

const updateDoctorSchema = z.object(doctorFields).partial();

async function findAdminDoctor(id: number): Promise<AdminDoctorRow> {
  const { rows } = await query<AdminDoctorRow>(`${SELECT_DOCTOR} WHERE d.id = $1`, [id]);
  if (!rows[0]) throw new HttpError(404, "Doctor not found.");
  return rows[0];
}

adminRouter.get("/doctors", async (_req, res) => {
  const { rows } = await query<AdminDoctorRow>(`${SELECT_DOCTOR} ORDER BY d.name`);
  res.json({ doctors: rows.map(toAdminDoctor) });
});

adminRouter.post("/doctors", async (req, res) => {
  const input = createDoctorSchema.parse(req.body);
  try {
    const id = await withTransaction(async (client) => {
      let userId: number | null = null;
      if (input.account) {
        const hash = await hashPassword(input.account.password);
        const u = await client.query<{ id: number }>(
          `INSERT INTO users (user_id, full_name, password_hash, role) VALUES ($1, $2, $3, 'doctor') RETURNING id`,
          [input.account.userId, input.name, hash],
        );
        userId = u.rows[0].id;
      }
      const d = await client.query<{ id: number }>(
        `INSERT INTO doctors (name, specialization, experience, location, fee, phone, email, available, user_id, bio, qualifications)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [
          input.name, input.specialization, input.experience, input.location, input.fee,
          input.phone ?? null, input.email ?? null, input.available, userId,
          input.bio ?? null, input.qualifications ?? null,
        ],
      );
      return d.rows[0].id;
    });
    res.status(201).json({ doctor: toAdminDoctor(await findAdminDoctor(id)) });
  } catch (err) {
    if (isPgError(err, PG_UNIQUE_VIOLATION)) {
      const constraint = (err as { constraint?: string }).constraint ?? "";
      throw new HttpError(409, constraint === "doctors_name_key" ? "A doctor with that name already exists." : "That User ID is already taken.");
    }
    throw err;
  }
});

// Column names come from this fixed map, never from the request.
const DOCTOR_COLUMN: Record<keyof z.infer<typeof updateDoctorSchema>, string> = {
  name: "name",
  specialization: "specialization",
  experience: "experience",
  location: "location",
  fee: "fee",
  phone: "phone",
  bio: "bio",
  qualifications: "qualifications",
  email: "email",
  available: "available",
};

adminRouter.patch("/doctors/:id", async (req, res) => {
  const id = parseId(req.params.id, "Doctor");
  const changes = updateDoctorSchema.parse(req.body);
  const entries = (Object.entries(changes) as [keyof typeof DOCTOR_COLUMN, unknown][]).filter(([, v]) => v !== undefined);
  if (entries.length === 0) throw new HttpError(400, "Nothing to update.");
  await findAdminDoctor(id);

  const sets = entries.map(([key], i) => `${DOCTOR_COLUMN[key]} = $${i + 1}`);
  try {
    await query(`UPDATE doctors SET ${sets.join(", ")} WHERE id = $${entries.length + 1}`, [...entries.map(([, v]) => v), id]);
  } catch (err) {
    if (isPgError(err, PG_UNIQUE_VIOLATION)) throw new HttpError(409, "A doctor with that name already exists.");
    throw err;
  }
  res.json({ doctor: toAdminDoctor(await findAdminDoctor(id)) });
});

/** Gives an existing doctor a login. A doctor can have one account. */
adminRouter.post("/doctors/:id/account", async (req, res) => {
  const id = parseId(req.params.id, "Doctor");
  const { userId, password } = accountSchema.parse(req.body);
  const doctor = await findAdminDoctor(id);
  if (doctor.account_user_id) throw new HttpError(409, "This doctor already has a login.");

  try {
    await withTransaction(async (client) => {
      const hash = await hashPassword(password);
      const u = await client.query<{ id: number }>(
        `INSERT INTO users (user_id, full_name, password_hash, role) VALUES ($1, $2, $3, 'doctor') RETURNING id`,
        [userId, doctor.name, hash],
      );
      await client.query("UPDATE doctors SET user_id = $1 WHERE id = $2", [u.rows[0].id, id]);
    });
  } catch (err) {
    if (isPgError(err, PG_UNIQUE_VIOLATION)) throw new HttpError(409, "That User ID is already taken.");
    throw err;
  }
  res.status(201).json({ doctor: toAdminDoctor(await findAdminDoctor(id)) });
});

// ---------- Appointments ----------

const appointmentFilterSchema = z.object({
  date: z.string().optional(),
  doctorId: idSchema.optional(),
  status: z.enum(["upcoming", "past", "completed", "no_show", "cancelled"]).optional(),
});

adminRouter.get("/appointments", async (req, res) => {
  const { date, doctorId, status } = appointmentFilterSchema.parse(req.query);
  if (date !== undefined && !isValidDate(date)) throw new HttpError(400, "Please choose a valid date.");

  const { rows } = await query<AppointmentRow>(
    `${SELECT_APPOINTMENT}
     WHERE ($1::date IS NULL OR a.appointment_date = $1) AND ($2::int IS NULL OR a.doctor_id = $2)
     ORDER BY a.appointment_date DESC, a.time_slot DESC
     LIMIT 500`,
    [date ?? null, doctorId ?? null],
  );
  const now = hospitalNow();
  const appointments = rows.map((r) => toAppointment(r, now)).filter((a) => !status || a.status === status);
  res.json({ appointments });
});

adminRouter.patch("/appointments/:id/cancel", async (req, res) => {
  const id = parseId(req.params.id, "Appointment");
  const { rows } = await query<AppointmentRow>(`${SELECT_APPOINTMENT} WHERE a.id = $1`, [id]);
  if (!rows[0]) throw new HttpError(404, "Appointment not found.");
  const current = toAppointment(rows[0]);
  if (current.status === "cancelled") throw new HttpError(409, "This appointment is already cancelled.");
  if (current.status !== "upcoming") throw new HttpError(409, "Only upcoming appointments can be cancelled.");

  await query("UPDATE appointments SET status = 'cancelled', updated_at = now() WHERE id = $1", [id]);
  notifyAppointment(id, "cancelled_by_hospital");
  const updated = await query<AppointmentRow>(`${SELECT_APPOINTMENT} WHERE a.id = $1`, [id]);
  res.json({ appointment: toAppointment(updated.rows[0]) });
});

// ---------- Users ----------

/**
 * Sets a new password for a doctor or another admin, who have no email to reset it with. They are signed
 * out everywhere. Patients are excluded on purpose: knowing a patient's password would let an admin read
 * their health records, so patients reset their own with the emailed link.
 */
adminRouter.post("/users/:id/password", async (req, res) => {
  const id = parseId(req.params.id, "User");
  const { password } = z.object({ password: passwordSchema }).parse(req.body);
  if (id === currentUserId(req)) {
    throw new HttpError(400, "Use Change password to update your own password.");
  }
  const { rows } = await query<{ role: string }>("SELECT role FROM users WHERE id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "User not found.");
  if (rows[0].role === "patient") {
    throw new HttpError(403, "Patients reset their own password with the link on the login page. This keeps their health records private.");
  }
  await query("UPDATE users SET password_hash = $2, password_changed_at = $3 WHERE id = $1", [id, await hashPassword(password), new Date()]);
  res.json({ ok: true });
});

adminRouter.get("/users", async (_req, res) => {
  const { rows } = await query<{ id: number; user_id: string; full_name: string; role: string; created_at: Date }>(
    "SELECT id, user_id, full_name, role, created_at FROM users ORDER BY created_at DESC, id DESC LIMIT 500",
  );
  res.json({
    users: rows.map((r) => ({ id: r.id, userId: r.user_id, fullName: r.full_name, role: r.role, createdAt: r.created_at })),
  });
});
