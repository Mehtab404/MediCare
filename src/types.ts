// Shapes returned by the MediCare API (see server/routes).

export type Role = "patient" | "doctor" | "admin";

/** The logged-in account. */
export interface User {
  id: number;
  userId: string;
  fullName: string;
  role: Role;
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
  bio: string | null;
  /** One qualification per line. */
  qualifications: string | null;
}

export type BookingType = "normal" | "tatkal";
/** "past" means the slot has started and the doctor hasn't closed it yet. */
export type AppointmentStatus = "upcoming" | "past" | "completed" | "no_show" | "cancelled";

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
  patient: { id: number; fullName: string; userId: string };
}

/** A doctor as the admin sees it, including the login linked to the record. */
export interface AdminDoctor extends Doctor {
  accountUserId: string | null;
}

export interface DoctorInput {
  name: string;
  specialization: string;
  experience: number;
  location: string;
  fee: number;
  phone: string | null;
  email: string | null;
  bio: string | null;
  qualifications: string | null;
  available: boolean;
}

export interface AdminStats {
  patients: number;
  doctorAccounts: number;
  admins: number;
  doctors: number;
  doctorsAvailable: number;
  upcomingAppointments: number;
  appointmentsToday: number;
  cancelled: number;
  completed: number;
  noShow: number;
}

export interface AccountUser extends User {
  createdAt: string;
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

export interface PatientProfile {
  /** "YYYY-MM-DD" */
  dateOfBirth: string | null;
  gender: "female" | "male" | "other" | null;
  bloodGroup: string | null;
  phone: string | null;
  allergies: string | null;
  conditions: string | null;
  currentMedications: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  updatedAt: string | null;
}

export type PatientProfileInput = Omit<PatientProfile, "updatedAt">;

export interface PrescriptionItem {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface VisitRecordInput {
  diagnosis: string;
  notes: string;
  followUp: string;
  prescriptions: PrescriptionItem[];
}

export interface VisitRecord extends VisitRecordInput {
  updatedAt: string;
}

export interface Review {
  id: number;
  /** 1 to 5 */
  rating: number;
  comment: string;
  createdAt: string;
}

/** A review as shown on a doctor's page. Only the reviewer's first name is included. */
export interface PublicReview extends Review {
  patientName: string;
}

/** What a patient sees for a completed visit. */
export interface VisitSummary {
  appointment: Appointment;
  record: VisitRecord | null;
  review: Review | null;
}

/** What a doctor sees when opening one of their appointments. */
export interface DoctorVisit {
  appointment: Appointment;
  patientProfile: PatientProfile;
  record: VisitRecord | null;
}

/** The patient's notification address. Only a verified address receives appointment emails. */
export interface AccountEmail {
  email: string | null;
  emailVerified: boolean;
  /** False when the server has no email provider configured. */
  emailEnabled: boolean;
}
