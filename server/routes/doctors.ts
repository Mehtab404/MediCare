import { Router } from "express";
import { z } from "zod";
import { query } from "../db.ts";
import { requireAuth } from "../auth.ts";
import { HttpError } from "../lib/http.ts";
import { bookingWindow, hospitalNow, isSlotPast, isValidDate, TATKAL_FEE, TIME_SLOTS } from "../lib/dates.ts";
import { DOCTOR_COLUMNS } from "../lib/doctorSql.ts";

export type DoctorRow = {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  /** Average of the doctor's reviews, 0 when there are none. */
  rating: number;
  reviews: number;
  available: boolean;
  location: string;
  fee: number;
  phone: string | null;
  email: string | null;
  bio: string | null;
  /** One qualification per line. */
  qualifications: string | null;
};

const idSchema = z.coerce.number().int().positive();

export async function findDoctor(id: number): Promise<DoctorRow | undefined> {
  const { rows } = await query<DoctorRow>(`SELECT ${DOCTOR_COLUMNS} FROM doctors d WHERE d.id = $1`, [id]);
  return rows[0];
}

export const doctorsRouter = Router();

doctorsRouter.get("/", async (_req, res) => {
  const { rows } = await query<DoctorRow>(`SELECT ${DOCTOR_COLUMNS} FROM doctors d ORDER BY d.id`);
  res.json({ doctors: rows });
});

doctorsRouter.get("/:id", async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  const doctor = id.success ? await findDoctor(id.data) : undefined;
  if (!doctor) throw new HttpError(404, "Doctor not found.");
  res.json({ doctor });
});

/** The newest reviews for a doctor. Only the reviewer's first name is shown. */
doctorsRouter.get("/:id/reviews", async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  const doctor = id.success ? await findDoctor(id.data) : undefined;
  if (!doctor) throw new HttpError(404, "Doctor not found.");

  const { rows } = await query<{ id: number; rating: number; comment: string; created_at: Date; full_name: string }>(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.full_name
     FROM reviews r JOIN users u ON u.id = r.patient_id
     WHERE r.doctor_id = $1
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT 50`,
    [doctor.id],
  );
  res.json({
    reviews: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      patientName: r.full_name.split(/\s+/)[0],
    })),
  });
});

/**
 * Booking window and, when a date is given, the status of each slot for this doctor:
 * "open", "booked" (someone holds it) or "past" (already started today).
 */
doctorsRouter.get("/:id/slots", requireAuth, async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  const doctor = id.success ? await findDoctor(id.data) : undefined;
  if (!doctor) throw new HttpError(404, "Doctor not found.");

  const now = hospitalNow();
  const window = bookingWindow(now);
  const date = typeof req.query.date === "string" ? req.query.date : undefined;

  let slots: { time: string; status: "open" | "booked" | "past" }[] | null = null;
  if (date) {
    if (!isValidDate(date)) throw new HttpError(400, "Please choose a valid date.");
    const { rows } = await query<{ time_slot: string }>(
      `SELECT time_slot FROM appointments
       WHERE doctor_id = $1 AND appointment_date = $2 AND status = 'booked'`,
      [doctor.id, date],
    );
    const booked = new Set(rows.map((r) => r.time_slot));
    slots = TIME_SLOTS.map((time) => ({
      time,
      status: isSlotPast(date, time, now) ? "past" : booked.has(time) ? "booked" : "open",
    }));
  }

  res.json({ ...window, tatkalFee: TATKAL_FEE, date: date ?? null, slots });
});
