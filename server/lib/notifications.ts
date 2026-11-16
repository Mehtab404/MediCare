import { config } from "../config.ts";
import { query } from "../db.ts";
import { sendMail } from "./mailer.ts";

type Row = {
  id: number;
  appointment_date: string;
  time_slot: string;
  booking_type: "normal" | "tatkal";
  amount: number;
  doctor_name: string;
  specialization: string;
  location: string;
  full_name: string;
  email: string;
};

export type AppointmentEvent = "booked" | "rescheduled" | "cancelled_by_patient" | "cancelled_by_hospital" | "reminder";

/** The appointment together with the patient's address, but only if that address is verified. */
async function loadForEmail(appointmentId: number): Promise<Row | undefined> {
  const { rows } = await query<Row>(
    `SELECT a.id, a.appointment_date, a.time_slot, a.booking_type, a.amount,
            d.name AS doctor_name, d.specialization, d.location, u.full_name, u.email
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     JOIN users u ON u.id = a.patient_id
     WHERE a.id = $1 AND u.email IS NOT NULL AND u.email_verified_at IS NOT NULL`,
    [appointmentId],
  );
  return rows[0];
}

function longDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-IN", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function clock(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function details(r: Row, withFee: boolean): string {
  const lines = [
    `Doctor:   ${r.doctor_name} (${r.specialization})`,
    `Date:     ${longDate(r.appointment_date)}`,
    `Time:     ${clock(r.time_slot)}`,
    `Location: ${r.location}`,
    `Booking:  #${r.id}${r.booking_type === "tatkal" ? " (Tatkal)" : ""}`,
  ];
  if (withFee) lines.push(`Fee:      Rs. ${r.amount}, payable at the billing counter`);
  return lines.join("\n");
}

const FOOTER = (appUrl: string) =>
  `\nManage your appointments: ${appUrl}/appointments\n\n` +
  `You get these emails because this address is verified on your MediCare account.\n` +
  `To stop them, remove your email on your Health Profile page: ${appUrl}/profile\n`;

function compose(event: AppointmentEvent, r: Row) {
  const hello = `Hello ${r.full_name.split(/\s+/)[0]},\n\n`;
  const when = `${longDate(r.appointment_date)} at ${clock(r.time_slot)}`;
  switch (event) {
    case "booked":
      return {
        subject: `Appointment confirmed with ${r.doctor_name} on ${longDate(r.appointment_date)}`,
        body:
          `${hello}Your appointment is booked.\n\n${details(r, true)}\n\n` +
          `Please arrive 10 minutes early and show your booking ID at the billing counter.\n`,
      };
    case "rescheduled":
      return {
        subject: `Appointment moved to ${when}`,
        body: `${hello}Your appointment has been rescheduled.\n\n${details(r, true)}\n`,
      };
    case "cancelled_by_patient":
      return {
        subject: `Appointment cancelled: ${r.doctor_name}, ${longDate(r.appointment_date)}`,
        body: `${hello}You cancelled this appointment. Nothing is payable.\n\n${details(r, false)}\n`,
      };
    case "cancelled_by_hospital":
      return {
        subject: `Your appointment was cancelled by the hospital: ${r.doctor_name}, ${longDate(r.appointment_date)}`,
        body:
          `${hello}The hospital has cancelled this appointment. Nothing is payable. ` +
          `You can book another time on the website.\n\n${details(r, false)}\n`,
      };
    case "reminder":
      return {
        subject: `Reminder: appointment with ${r.doctor_name} on ${when}`,
        body:
          `${hello}This is a reminder of your appointment within the next 24 hours.\n\n${details(r, true)}\n\n` +
          `Please arrive 10 minutes early and show your booking ID at the billing counter.\n`,
      };
  }
}

/**
 * Emails the patient about an appointment, if they have a verified address.
 * Resolves to false when nothing was sent. Throws if the mail server fails.
 */
export async function sendAppointmentEmail(appointmentId: number, event: AppointmentEvent): Promise<boolean> {
  const row = await loadForEmail(appointmentId);
  if (!row) return false;
  const { subject, body } = compose(event, row);
  await sendMail({ to: row.email, subject, text: body + FOOTER(config.appUrl) });
  return true;
}

/** Fire and forget: a mail problem must never fail the booking that triggered it. */
export function notifyAppointment(appointmentId: number, event: AppointmentEvent): void {
  if (config.mail.mode === "off") return;
  sendAppointmentEmail(appointmentId, event).catch((err: unknown) => {
    console.error(`Could not send ${event} email for appointment ${appointmentId}:`, err instanceof Error ? err.message : err);
  });
}
