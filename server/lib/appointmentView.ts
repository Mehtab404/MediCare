import { hospitalNow, isSlotPast } from "./dates.ts";

export type AppointmentRow = {
  id: number;
  appointment_date: string;
  time_slot: string;
  booking_type: "normal" | "tatkal";
  amount: number;
  status: "booked" | "cancelled" | "completed" | "no_show";
  created_at: Date;
  doctor_id: number;
  doctor_name: string;
  doctor_specialization: string;
  doctor_location: string;
  patient_id: number;
  patient_name: string;
  patient_user_id: string;
};

export const SELECT_APPOINTMENT = `
  SELECT a.id, a.appointment_date, a.time_slot, a.booking_type, a.amount, a.status, a.created_at,
         d.id AS doctor_id, d.name AS doctor_name, d.specialization AS doctor_specialization,
         d.location AS doctor_location,
         u.id AS patient_id, u.full_name AS patient_name, u.user_id AS patient_user_id
  FROM appointments a
  JOIN doctors d ON d.id = a.doctor_id
  JOIN users u ON u.id = a.patient_id`;

/**
 * API shape. "status" is derived: a booked appointment is "upcoming" until its slot starts,
 * then "past" until the doctor marks it "completed" or "no_show".
 */
export function toAppointment(row: AppointmentRow, now = hospitalNow()) {
  const status =
    row.status === "booked"
      ? isSlotPast(row.appointment_date, row.time_slot, now)
        ? "past"
        : "upcoming"
      : row.status === "no_show"
        ? "no_show"
        : row.status;
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
    patient: { id: row.patient_id, fullName: row.patient_name, userId: row.patient_user_id },
  };
}
