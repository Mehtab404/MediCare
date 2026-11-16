import { Router } from "express";
import { z } from "zod";
import { query } from "../db.ts";
import { currentPatientId, requireAuth } from "../auth.ts";
import { HttpError, isPgError, PG_UNIQUE_VIOLATION } from "../lib/http.ts";
import { checkDateAndSlot, hospitalNow, isSlotPast, TATKAL_FEE } from "../lib/dates.ts";
import { findDoctor } from "./doctors.ts";

type AppointmentRow = {
  id: number;
  appointment_date: string;
  time_slot: string;
  booking_type: "normal" | "tatkal";
  amount: number;
  status: "booked" | "cancelled";
  created_at: Date;
  doctor_id: number;
  doctor_name: string;
  doctor_specialization: string;
  doctor_location: string;
};

const SELECT_APPOINTMENT = `
  SELECT a.id, a.appointment_date, a.time_slot, a.booking_type, a.amount, a.status, a.created_at,
         d.id AS doctor_id, d.name AS doctor_name, d.specialization AS doctor_specialization,
         d.location AS doctor_location
  FROM appointments a
  JOIN doctors d ON d.id = a.doctor_id`;

/** API shape. "status" is derived: booked appointments whose slot has started count as "past". */
function toAppointment(row: AppointmentRow, now = hospitalNow()) {
  const status =
    row.status === "cancelled" ? "cancelled" : isSlotPast(row.appointment_date, row.time_slot, now) ? "past" : "upcoming";
  return {
    id: row.id,
    date: row.appointment_date,
    time: row.time_slot,
    bookingType: row.booking_type,
    amount: row.amount,
    status,
    createdAt: row.created_at,
    doctor: {
      id: row.doctor_id,
      name: row.doctor_name,
      specialization: row.doctor_specialization,
      location: row.doctor_location,
    },
  };
}

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
appointmentsRouter.use(requireAuth);

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
  if (current.status === "past") throw new HttpError(409, "Past appointments can't be cancelled.");

  await query(
    `UPDATE appointments SET status = 'cancelled', updated_at = now()
     WHERE id = $1 AND patient_id = $2`,
    [row.id, patientId],
  );
  const updated = await findOwnAppointment(patientId, String(row.id));
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
      `UPDATE appointments SET appointment_date = $1, time_slot = $2, updated_at = now()
       WHERE id = $3 AND patient_id = $4`,
      [date, time, row.id, patientId],
    );
  } catch (err) {
    if (isPgError(err, PG_UNIQUE_VIOLATION)) throw new HttpError(409, SLOT_TAKEN);
    throw err;
  }
  const updated = await findOwnAppointment(patientId, String(row.id));
  res.json({ appointment: toAppointment(updated) });
});
