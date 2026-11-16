import { config } from "../config.ts";
import { query } from "../db.ts";
import { sendAppointmentEmail } from "./notifications.ts";

const CHECK_EVERY_MS = 15 * 60 * 1000;

/** Start of the appointment as a timestamp, in the hospital's time zone. */
const START = "((a.appointment_date + a.time_slot::time) AT TIME ZONE $1)";

/**
 * Emails a reminder for every booked appointment that starts within the next 24 hours, once.
 * Appointments booked less than 24 hours ahead are skipped: their confirmation email is the reminder.
 * Only patients with a verified address are considered. Returns how many reminders were sent.
 */
export async function sendDueReminders(): Promise<number> {
  const { rows } = await query<{ id: number }>(
    `SELECT a.id FROM appointments a
     JOIN users u ON u.id = a.patient_id
     WHERE a.status = 'booked' AND a.reminder_sent_at IS NULL
       AND u.email IS NOT NULL AND u.email_verified_at IS NOT NULL
       AND ${START} > now()
       AND ${START} <= now() + interval '24 hours'
       AND a.created_at <= ${START} - interval '24 hours'`,
    [config.timeZone],
  );

  let sent = 0;
  for (const { id } of rows) {
    // Claim it first so two server instances never send the same reminder.
    const claim = await query("UPDATE appointments SET reminder_sent_at = now() WHERE id = $1 AND reminder_sent_at IS NULL", [id]);
    if (claim.rowCount === 0) continue;
    try {
      if (await sendAppointmentEmail(id, "reminder")) sent++;
    } catch (err) {
      // Release the claim so the next check tries again, until the appointment starts.
      await query("UPDATE appointments SET reminder_sent_at = NULL WHERE id = $1", [id]);
      console.error(`Could not send the reminder for appointment ${id}:`, err instanceof Error ? err.message : err);
    }
  }
  return sent;
}

/** Checks shortly after start-up and then every 15 minutes. Does nothing if email isn't set up. */
export function startReminderJob() {
  if (config.mail.mode === "off") {
    console.warn("Email is not configured (SMTP_HOST is missing), so no emails or reminders will be sent.");
    return;
  }
  const run = () =>
    sendDueReminders()
      .then((n) => n > 0 && console.log(`Sent ${n} appointment reminder${n === 1 ? "" : "s"}.`))
      .catch((err) => console.error("Reminder check failed:", err instanceof Error ? err.message : err));
  setTimeout(run, 10_000).unref();
  setInterval(run, CHECK_EVERY_MS).unref();
}
