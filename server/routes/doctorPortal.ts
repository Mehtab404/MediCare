import { Router, type Request } from "express";
import { z } from "zod";
import { query, withTransaction } from "../db.ts";
import { currentUserId, requireRole } from "../auth.ts";
import { HttpError } from "../lib/http.ts";
import { hospitalNow, isValidDate } from "../lib/dates.ts";
import { SELECT_APPOINTMENT, toAppointment, type AppointmentRow } from "../lib/appointmentView.ts";
import { PROFILE_COLUMNS, toProfile, type ProfileRow } from "../lib/profile.ts";
import { loadVisitRecord, recordSchema, saveVisitRecord } from "../lib/visitRecord.ts";
import { findDoctor, type DoctorRow } from "./doctors.ts";

/** Routes for a logged-in doctor, scoped to the doctor record linked to their account. */
export const doctorPortalRouter = Router();
doctorPortalRouter.use(requireRole("doctor"));

const idSchema = z.coerce.number().int().positive();

async function ownDoctor(req: Request): Promise<DoctorRow> {
  const { rows } = await query<{ id: number }>("SELECT id FROM doctors WHERE user_id = $1", [currentUserId(req)]);
  const doctor = rows[0] ? await findDoctor(rows[0].id) : undefined;
  if (!doctor) throw new HttpError(404, "No doctor profile is linked to this account. Please contact an administrator.");
  return doctor;
}

/** An appointment that belongs to this doctor. Anyone else's is "not found". */
async function ownAppointment(doctor: DoctorRow, rawId: string): Promise<AppointmentRow> {
  const id = idSchema.safeParse(rawId);
  if (id.success) {
    const { rows } = await query<AppointmentRow>(`${SELECT_APPOINTMENT} WHERE a.id = $1 AND a.doctor_id = $2`, [
      id.data,
      doctor.id,
    ]);
    if (rows[0]) return rows[0];
  }
  throw new HttpError(404, "Appointment not found.");
}

doctorPortalRouter.get("/me", async (req, res) => {
  res.json({ doctor: await ownDoctor(req) });
});

const availabilitySchema = z.object({ available: z.boolean({ required_error: "Please choose an availability." }) });

doctorPortalRouter.patch("/availability", async (req, res) => {
  const { available } = availabilitySchema.parse(req.body);
  const doctor = await ownDoctor(req);
  await query("UPDATE doctors SET available = $1 WHERE id = $2", [available, doctor.id]);
  res.json({ doctor: { ...doctor, available } });
});

doctorPortalRouter.get("/appointments", async (req, res) => {
  const doctor = await ownDoctor(req);
  const date = typeof req.query.date === "string" && req.query.date !== "" ? req.query.date : null;
  if (date !== null && !isValidDate(date)) throw new HttpError(400, "Please choose a valid date.");

  const { rows } = await query<AppointmentRow>(
    `${SELECT_APPOINTMENT}
     WHERE a.doctor_id = $1 AND ($2::date IS NULL OR a.appointment_date = $2)
     ORDER BY a.appointment_date, a.time_slot
     LIMIT 500`,
    [doctor.id, date],
  );
  const now = hospitalNow();
  res.json({ appointments: rows.map((r) => toAppointment(r, now)) });
});

/**
 * One of this doctor's appointments with the patient's health profile and any saved record.
 * Cancelled appointments are closed off: the doctor has no reason to see that patient's details.
 */
doctorPortalRouter.get("/appointments/:id", async (req, res) => {
  const doctor = await ownDoctor(req);
  const row = await ownAppointment(doctor, req.params.id);
  const appointment = toAppointment(row);
  if (appointment.status === "cancelled") throw new HttpError(409, "This appointment was cancelled.");

  const profile = await query<ProfileRow>(`SELECT ${PROFILE_COLUMNS} FROM patient_profiles WHERE user_id = $1`, [
    row.patient_id,
  ]);
  res.json({ appointment, patientProfile: toProfile(profile.rows[0]), record: await loadVisitRecord(row.id) });
});

/** Saves the visit notes and prescription. Allowed once the slot has started, and still editable after completing. */
doctorPortalRouter.put("/appointments/:id/record", async (req, res) => {
  const input = recordSchema.parse(req.body);
  const doctor = await ownDoctor(req);
  const row = await ownAppointment(doctor, req.params.id);
  const { status } = toAppointment(row);
  if (status === "upcoming") throw new HttpError(409, "This appointment hasn't started yet.");
  if (status === "cancelled") throw new HttpError(409, "This appointment was cancelled.");
  if (status === "no_show") throw new HttpError(409, "A missed appointment has no visit record.");

  await withTransaction((client) => saveVisitRecord(client, row.id, input));
  res.json({ record: await loadVisitRecord(row.id) });
});

const statusSchema = z.object({
  status: z.enum(["completed", "no_show"], { errorMap: () => ({ message: "Status must be completed or no_show." }) }),
});

/** Closes out a visit. Only the doctor it belongs to can do this, and only once the slot has started. */
doctorPortalRouter.patch("/appointments/:id/status", async (req, res) => {
  const { status } = statusSchema.parse(req.body);
  const doctor = await ownDoctor(req);
  const row = await ownAppointment(doctor, req.params.id);

  const current = toAppointment(row);
  if (current.status === "upcoming") throw new HttpError(409, "This appointment hasn't started yet.");
  if (current.status !== "past") throw new HttpError(409, "This appointment has already been closed.");

  await query("UPDATE appointments SET status = $1, updated_at = now() WHERE id = $2", [status, row.id]);
  const updated = await query<AppointmentRow>(`${SELECT_APPOINTMENT} WHERE a.id = $1`, [row.id]);
  res.json({ appointment: toAppointment(updated.rows[0]) });
});
