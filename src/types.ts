// Shapes returned by the MediCare API (see server/routes).

export interface Patient {
  id: number;
  userId: string;
  fullName: string;
}

export interface Doctor {
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
}

export type BookingType = "normal" | "tatkal";
export type AppointmentStatus = "upcoming" | "past" | "cancelled";

export interface Appointment {
  id: number;
  /** "YYYY-MM-DD" */
  date: string;
  /** 24h "HH:MM" */
  time: string;
  bookingType: BookingType;
  amount: number;
  status: AppointmentStatus;
  createdAt: string;
  doctor: Pick<Doctor, "id" | "name" | "specialization" | "location">;
}

export type SlotStatus = "open" | "booked" | "past";

export interface SlotsResponse {
  today: string;
  tomorrow: string;
  maxDate: string;
  tatkalFee: number;
  date: string | null;
  slots: { time: string; status: SlotStatus }[] | null;
}
