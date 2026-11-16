import type { Appointment, BookingType, Doctor, Patient, SlotsResponse } from "@/types";

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
  me: () => request<{ patient: Patient }>("/auth/me").then((r) => r.patient),
  login: (userId: string, password: string) =>
    request<{ patient: Patient }>("/auth/login", { method: "POST", body: { userId, password } }).then((r) => r.patient),
  register: (userId: string, fullName: string, password: string) =>
    request<{ patient: Patient }>("/auth/register", { method: "POST", body: { userId, fullName, password } }).then(
      (r) => r.patient,
    ),
  logout: () => request<void>("/auth/logout", { method: "POST" }),

  doctors: () => request<{ doctors: Doctor[] }>("/doctors").then((r) => r.doctors),
  doctor: (id: number) => request<{ doctor: Doctor }>(`/doctors/${id}`).then((r) => r.doctor),
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
};
