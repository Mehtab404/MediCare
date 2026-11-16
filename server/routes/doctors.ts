import { Router } from "express";
import { z } from "zod";
import { query } from "../db.ts";
import { requireAuth } from "../auth.ts";
import { HttpError } from "../lib/http.ts";
import { bookingWindow, hospitalNow, isSlotPast, isValidDate, TATKAL_FEE, TIME_SLOTS } from "../lib/dates.ts";

export type DoctorRow = {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  reviews: number;
  available: boolean;
  location: string;
  fee: number;
  phone: string | null;
  email: string | null;
};

const DOCTOR_COLUMNS = "id, name, specialization, experience, rating, reviews, available, location, fee, phone, email";

const idSchema = z.coerce.number().int().positive();

export async function findDoctor(id: number): Promise<DoctorRow | undefined> {
  const { rows } = await query<DoctorRow>(`SELECT ${DOCTOR_COLUMNS} FROM doctors WHERE id = $1`, [id]);
  return rows[0];
}

export const doctorsRouter = Router();

doctorsRouter.get("/", async (_req, res) => {
  const { rows } = await query<DoctorRow>(`SELECT ${DOCTOR_COLUMNS} FROM doctors ORDER BY id`);
  res.json({ doctors: rows });
});

doctorsRouter.get("/:id", async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  const doctor = id.success ? await findDoctor(id.data) : undefined;
  if (!doctor) throw new HttpError(404, "Doctor not found.");
  res.json({ doctor });
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
