import type {
  AccountEmail,
  AccountUser,
  AdminDoctor,
  AdminStats,
  Appointment,
  AppointmentStatus,
  BookingType,
  Doctor,
  DoctorInput,
  DoctorVisit,
  PatientProfile,
  PatientProfileInput,
  PublicReview,
  Review,
  SlotsResponse,
  User,
  VisitRecord,
  VisitRecordInput,
  VisitSummary,
} from "@/types";

/** Error from the API. `message` is the server's user-facing text. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;

/** Called when a request that needs a session gets a 401 (for example, the session expired). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: options.method ?? "GET",
      credentials: "same-origin",
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && typeof data.error === "string" && data.error) || "Something went wrong. Please try again.";
    if (res.status === 401 && !path.startsWith("/auth/")) onUnauthorized?.();
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const api = {
  me: () => request<{ user: User }>("/auth/me").then((r) => r.user),
  login: (userId: string, password: string) =>
    request<{ user: User }>("/auth/login", { method: "POST", body: { userId, password } }).then((r) => r.user),
  register: (userId: string, fullName: string, password: string) =>
    request<{ user: User }>("/auth/register", { method: "POST", body: { userId, fullName, password } }).then(
      (r) => r.user,
    ),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  forgotPassword: (identifier: string) =>
    request<{ message: string }>("/auth/forgot-password", { method: "POST", body: { identifier } }),
  resetPassword: (token: string, password: string) =>
    request<{ ok: boolean }>("/auth/reset-password", { method: "POST", body: { token, password } }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }),

  doctors: () => request<{ doctors: Doctor[] }>("/doctors").then((r) => r.doctors),
  doctor: (id: number) => request<{ doctor: Doctor }>(`/doctors/${id}`).then((r) => r.doctor),
  doctorReviews: (id: number) => request<{ reviews: PublicReview[] }>(`/doctors/${id}/reviews`).then((r) => r.reviews),
  slots: (doctorId: number, date?: string) =>
    request<SlotsResponse>(`/doctors/${doctorId}/slots${date ? `?date=${encodeURIComponent(date)}` : ""}`),

  appointments: () => request<{ appointments: Appointment[] }>("/appointments").then((r) => r.appointments),
  appointment: (id: number) => request<{ appointment: Appointment }>(`/appointments/${id}`).then((r) => r.appointment),
  book: (input: { doctorId: number; date: string; time: string; bookingType: BookingType }) =>
    request<{ appointment: Appointment }>("/appointments", { method: "POST", body: input }).then((r) => r.appointment),
  cancel: (id: number) =>
    request<{ appointment: Appointment }>(`/appointments/${id}/cancel`, { method: "PATCH" }).then((r) => r.appointment),
  reschedule: (id: number, date: string, time: string) =>
    request<{ appointment: Appointment }>(`/appointments/${id}/reschedule`, { method: "PATCH", body: { date, time } }).then(
      (r) => r.appointment,
    ),

  // Patient health profile and visit records
  account: () => request<AccountEmail>("/account"),
  setEmail: (email: string) => request<AccountEmail>("/account/email", { method: "PUT", body: { email } }),
  removeEmail: () => request<AccountEmail>("/account/email", { method: "DELETE" }),
  verifyEmail: (token: string) =>
    request<{ verified: boolean; email: string }>("/account/email/verify", { method: "POST", body: { token } }),
  profile: () => request<{ profile: PatientProfile }>("/profile").then((r) => r.profile),
  saveProfile: (input: PatientProfileInput) =>
    request<{ profile: PatientProfile }>("/profile", { method: "PUT", body: input }).then((r) => r.profile),
  visitSummary: (appointmentId: number) => request<VisitSummary>(`/appointments/${appointmentId}/record`),
  submitReview: (appointmentId: number, input: { rating: number; comment: string }) =>
    request<{ review: Review }>(`/appointments/${appointmentId}/review`, { method: "POST", body: input }).then((r) => r.review),

  // Doctor portal (role: doctor)
  doctorMe: () => request<{ doctor: Doctor }>("/doctor/me").then((r) => r.doctor),
  doctorSetAvailable: (available: boolean) =>
    request<{ doctor: Doctor }>("/doctor/availability", { method: "PATCH", body: { available } }).then((r) => r.doctor),
  doctorAppointments: (date?: string) =>
    request<{ appointments: Appointment[] }>(`/doctor/appointments${date ? `?date=${encodeURIComponent(date)}` : ""}`).then(
      (r) => r.appointments,
    ),
  doctorVisit: (id: number) => request<DoctorVisit>(`/doctor/appointments/${id}`),
  doctorSaveRecord: (id: number, input: VisitRecordInput) =>
    request<{ record: VisitRecord }>(`/doctor/appointments/${id}/record`, { method: "PUT", body: input }).then((r) => r.record),
  doctorCloseAppointment: (id: number, status: Extract<AppointmentStatus, "completed" | "no_show">) =>
    request<{ appointment: Appointment }>(`/doctor/appointments/${id}/status`, { method: "PATCH", body: { status } }).then(
      (r) => r.appointment,
    ),

  // Admin (role: admin)
  adminStats: () => request<AdminStats>("/admin/stats"),
  adminDoctors: () => request<{ doctors: AdminDoctor[] }>("/admin/doctors").then((r) => r.doctors),
  adminCreateDoctor: (input: DoctorInput & { account?: { userId: string; password: string } }) =>
    request<{ doctor: AdminDoctor }>("/admin/doctors", { method: "POST", body: input }).then((r) => r.doctor),
  adminUpdateDoctor: (id: number, changes: Partial<DoctorInput>) =>
    request<{ doctor: AdminDoctor }>(`/admin/doctors/${id}`, { method: "PATCH", body: changes }).then((r) => r.doctor),
  adminCreateDoctorAccount: (id: number, account: { userId: string; password: string }) =>
    request<{ doctor: AdminDoctor }>(`/admin/doctors/${id}/account`, { method: "POST", body: account }).then((r) => r.doctor),
  adminAppointments: (filters: { date?: string; doctorId?: number; status?: AppointmentStatus } = {}) => {
    const params = new URLSearchParams();
    if (filters.date) params.set("date", filters.date);
    if (filters.doctorId) params.set("doctorId", String(filters.doctorId));
    if (filters.status) params.set("status", filters.status);
    const qs = params.toString();
    return request<{ appointments: Appointment[] }>(`/admin/appointments${qs ? `?${qs}` : ""}`).then((r) => r.appointments);
  },
  adminCancelAppointment: (id: number) =>
    request<{ appointment: Appointment }>(`/admin/appointments/${id}/cancel`, { method: "PATCH" }).then((r) => r.appointment),
  adminUsers: () => request<{ users: AccountUser[] }>("/admin/users").then((r) => r.users),
  adminSetPassword: (id: number, password: string) =>
    request<{ ok: boolean }>(`/admin/users/${id}/password`, { method: "POST", body: { password } }),
};
