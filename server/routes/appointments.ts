import { Router } from "express";
import { z } from "zod";
import { query } from "../db.ts";
import { currentPatientId, requireRole } from "../auth.ts";
import { HttpError, isPgError, PG_UNIQUE_VIOLATION } from "../lib/http.ts";
import { checkDateAndSlot, hospitalNow, TATKAL_FEE } from "../lib/dates.ts";
import { SELECT_APPOINTMENT, toAppointment, type AppointmentRow } from "../lib/appointmentView.ts";
import { loadVisitRecord } from "../lib/visitRecord.ts";
import { notifyAppointment } from "../lib/notifications.ts";
import { findDoctor } from "./doctors.ts";

const idSchema = z.coerce.number().int().positive();
const dateSchema = z.string({ required_error: "Please choose a date." });
const timeSchema = z.string({ required_error: "Please choose a time slot." });

const createSchema = z.object({
  doctorId: z.number({ required_error: "Please choose a doctor." }).int().positive(),
  date: dateSchema,
  time: timeSchema,
  bookingType: z.enum(["normal", "tatkal"], { errorMap: () => ({ message: "Booking type must be normal or tatkal." }) }),
});

const rescheduleSchema = z.object({ date: dateSchema, time: timeSchema });

async function findOwnAppointment(patientId: number, rawId: string): Promise<AppointmentRow> {
  const id = idSchema.safeParse(rawId);
  if (id.success) {
    const { rows } = await query<AppointmentRow>(`${SELECT_APPOINTMENT} WHERE a.id = $1 AND a.patient_id = $2`, [
      id.data,
      patientId,
    ]);
    if (rows[0]) return rows[0];
  }
  throw new HttpError(404, "Appointment not found.");
}

/** Rejects a slot the patient already has with another doctor. */
async function assertPatientFree(patientId: number, date: string, time: string, excludeId?: number) {
  const { rows } = await query(
    `SELECT 1 FROM appointments
     WHERE patient_id = $1 AND appointment_date = $2 AND time_slot = $3 AND status = 'booked'
       AND ($4::int IS NULL OR id <> $4)`,
    [patientId, date, time, excludeId ?? null],
  );
  if (rows.length > 0) throw new HttpError(409, "You already have an appointment at that time.");
}

const SLOT_TAKEN = "Sorry, that slot was just booked. Please choose another time.";

export const appointmentsRouter = Router();
appointmentsRouter.use(requireRole("patient"));

appointmentsRouter.get("/", async (req, res) => {
  const patientId = currentPatientId(req);
  const { rows } = await query<AppointmentRow>(
    `${SELECT_APPOINTMENT} WHERE a.patient_id = $1 ORDER BY a.appointment_date, a.time_slot`,
    [patientId],
  );
  const now = hospitalNow();
  res.json({ appointments: rows.map((r) => toAppointment(r, now)) });
});

appointmentsRouter.get("/:id", async (req, res) => {
  const row = await findOwnAppointment(currentPatientId(req), req.params.id);
  res.json({ appointment: toAppointment(row) });
});

type ReviewRow = { id: number; rating: number; comment: string; created_at: Date };

function toReview(row: ReviewRow) {
  return { id: row.id, rating: row.rating, comment: row.comment, createdAt: row.created_at };
}

/**
 * The doctor's notes and prescription, plus the patient's own review if they left one.
 * Only visible once the doctor has marked the visit completed, so drafts stay private.
 */
appointmentsRouter.get("/:id/record", async (req, res) => {
  const patientId = currentPatientId(req);
  const row = await findOwnAppointment(patientId, req.params.id);
  if (toAppointment(row).status !== "completed") {
    throw new HttpError(404, "There's no visit summary for this appointment yet.");
  }
  const record = await loadVisitRecord(row.id);
  const review = await query<ReviewRow>("SELECT id, rating, comment, created_at FROM reviews WHERE appointment_id = $1", [row.id]);
  res.json({ appointment: toAppointment(row), record, review: review.rows[0] ? toReview(review.rows[0]) : null });
});

const reviewSchema = z.object({
  rating: z
    .number({ required_error: "Please choose a rating.", invalid_type_error: "Please choose a rating." })
    .int("Please choose a rating from 1 to 5.")
    .min(1, "Please choose a rating from 1 to 5.")
    .max(5, "Please choose a rating from 1 to 5."),
  comment: z.string().trim().max(1000, "Please keep your review under 1000 characters.").default(""),
});

appointmentsRouter.post("/:id/review", async (req, res) => {
  const patientId = currentPatientId(req);
  const { rating, comment } = reviewSchema.parse(req.body);
  const row = await findOwnAppointment(patientId, req.params.id);
  if (toAppointment(row).status !== "completed") {
    throw new HttpError(409, "You can review a visit after the doctor has completed it.");
  }
  try {
    const { rows } = await query<ReviewRow>(
      `INSERT INTO reviews (appointment_id, patient_id, doctor_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, rating, comment, created_at`,
      [row.id, patientId, row.doctor_id, rating, comment],
    );
    res.status(201).json({ review: toReview(rows[0]) });
  } catch (err) {
    if (isPgError(err, PG_UNIQUE_VIOLATION)) throw new HttpError(409, "You've already reviewed this visit.");
    throw err;
  }
});

appointmentsRouter.post("/", async (req, res) => {
  const patientId = currentPatientId(req);
  const { doctorId, date, time, bookingType } = createSchema.parse(req.body);

  const doctor = await findDoctor(doctorId);
  if (!doctor) throw new HttpError(404, "Doctor not found.");
  if (!doctor.available) throw new HttpError(409, `${doctor.name} isn't taking bookings right now.`);

  const problem = checkDateAndSlot(date, time, bookingType);
  if (problem) throw new HttpError(400, problem);
  await assertPatientFree(patientId, date, time);

  // The price comes from the database, never from the client.
  const amount = doctor.fee + (bookingType === "tatkal" ? TATKAL_FEE : 0);
  try {
    const { rows } = await query<{ id: number }>(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, booking_type, amount)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [patientId, doctor.id, date, time, bookingType, amount],
    );
    const row = await findOwnAppointment(patientId, String(rows[0].id));
    notifyAppointment(row.id, "booked");
    res.status(201).json({ appointment: toAppointment(row) });
  } catch (err) {
    if (isPgError(err, PG_UNIQUE_VIOLATION)) throw new HttpError(409, SLOT_TAKEN);
    throw err;
  }
});

appointmentsRouter.patch("/:id/cancel", async (req, res) => {
  const patientId = currentPatientId(req);
  const row = await findOwnAppointment(patientId, req.params.id);
  const current = toAppointment(row);
  if (current.status === "cancelled") throw new HttpError(409, "This appointment is already cancelled.");
  if (current.status !== "upcoming") throw new HttpError(409, "Past appointments can't be cancelled.");

  await query(
    `UPDATE appointments SET status = 'cancelled', updated_at = now()
     WHERE id = $1 AND patient_id = $2`,
    [row.id, patientId],
  );
  const updated = await findOwnAppointment(patientId, String(row.id));
  notifyAppointment(row.id, "cancelled_by_patient");
  res.json({ appointment: toAppointment(updated) });
});

appointmentsRouter.patch("/:id/reschedule", async (req, res) => {
  const patientId = currentPatientId(req);
  const { date, time } = rescheduleSchema.parse(req.body);
  const row = await findOwnAppointment(patientId, req.params.id);
  const current = toAppointment(row);
  if (current.status !== "upcoming") throw new HttpError(409, "Only upcoming appointments can be rescheduled.");
  if (date === row.appointment_date && time === row.time_slot) {
    throw new HttpError(400, "Please choose a different date or time.");
  }

  const doctor = await findDoctor(row.doctor_id);
  if (!doctor?.available) throw new HttpError(409, `${row.doctor_name} isn't taking bookings right now.`);

  // A Tatkal booking keeps its Tatkal rules (and price) when moved.
  const problem = checkDateAndSlot(date, time, row.booking_type);
  if (problem) throw new HttpError(400, problem);
  await assertPatientFree(patientId, date, time, row.id);

  try {
    await query(
      `UPDATE appointments SET appointment_date = $1, time_slot = $2, reminder_sent_at = NULL, updated_at = now()
       WHERE id = $3 AND patient_id = $4`,
      [date, time, row.id, patientId],
    );
  } catch (err) {
    if (isPgError(err, PG_UNIQUE_VIOLATION)) throw new HttpError(409, SLOT_TAKEN);
    throw err;
  }
  const updated = await findOwnAppointment(patientId, String(row.id));
  notifyAppointment(row.id, "rescheduled");
  res.json({ appointment: toAppointment(updated) });
});
