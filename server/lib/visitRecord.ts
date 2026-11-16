import type pg from "pg";
import { z } from "zod";
import { query } from "../db.ts";

type RecordRow = { diagnosis: string; notes: string; follow_up: string; updated_at: Date };
type ItemRow = { medicine: string; dosage: string; frequency: string; duration: string; instructions: string };

/** The doctor's notes and prescription for one visit, or null if none have been saved. */
export async function loadVisitRecord(appointmentId: number) {
  const { rows } = await query<RecordRow>(
    "SELECT diagnosis, notes, follow_up, updated_at FROM visit_records WHERE appointment_id = $1",
    [appointmentId],
  );
  if (!rows[0]) return null;
  const items = await query<ItemRow>(
    `SELECT medicine, dosage, frequency, duration, instructions
     FROM prescription_items WHERE appointment_id = $1 ORDER BY position`,
    [appointmentId],
  );
  return {
    diagnosis: rows[0].diagnosis,
    notes: rows[0].notes,
    followUp: rows[0].follow_up,
    updatedAt: rows[0].updated_at,
    prescriptions: items.rows,
  };
}

const required = (what: string, max: number) =>
  z.string().trim().min(1, `Each medicine needs ${what}.`).max(max, `The ${what} is too long.`);

export const recordSchema = z
  .object({
    diagnosis: z.string().trim().max(1000, "The diagnosis is too long.").default(""),
    notes: z.string().trim().max(4000, "The notes are too long.").default(""),
    followUp: z.string().trim().max(1000, "The follow-up advice is too long.").default(""),
    prescriptions: z
      .array(
        z.object({
          medicine: required("a name", 120),
          dosage: required("a dosage", 60),
          frequency: required("a frequency", 60),
          duration: required("a duration", 60),
          instructions: z.string().trim().max(300, "The instructions are too long.").default(""),
        }),
      )
      .max(20, "A prescription can have at most 20 medicines.")
      .default([]),
  })
  .refine((r) => r.diagnosis || r.notes || r.followUp || r.prescriptions.length > 0, {
    message: "Add a diagnosis, notes or a prescription before saving.",
  });

export type RecordInput = z.infer<typeof recordSchema>;

/** Replaces the saved record for an appointment. Run inside a transaction. */
export async function saveVisitRecord(client: pg.PoolClient, appointmentId: number, input: RecordInput) {
  await client.query(
    `INSERT INTO visit_records (appointment_id, diagnosis, notes, follow_up)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (appointment_id) DO UPDATE
       SET diagnosis = EXCLUDED.diagnosis, notes = EXCLUDED.notes, follow_up = EXCLUDED.follow_up, updated_at = now()`,
    [appointmentId, input.diagnosis, input.notes, input.followUp],
  );
  await client.query("DELETE FROM prescription_items WHERE appointment_id = $1", [appointmentId]);
  for (const [i, item] of input.prescriptions.entries()) {
    await client.query(
      `INSERT INTO prescription_items (appointment_id, position, medicine, dosage, frequency, duration, instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [appointmentId, i, item.medicine, item.dosage, item.frequency, item.duration, item.instructions],
    );
  }
}
