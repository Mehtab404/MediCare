import { config } from "../config.ts";

/** Bookable slots, 24h "HH:MM". */
export const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
] as const;

export const TATKAL_FEE = 300;

/** How far ahead a normal booking can be made. */
export const MAX_DAYS_AHEAD = 90;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Current date ("YYYY-MM-DD") and minutes since midnight in the hospital's time zone. */
export function hospitalNow(now = new Date()): { date: string; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: config.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** True for a real calendar date in "YYYY-MM-DD" form. */
export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Adds days to a "YYYY-MM-DD" date. Works on the calendar date only, so no time zone effects. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function slotMinutes(slot: string): number {
  const [h, m] = slot.split(":").map(Number);
  return h * 60 + m;
}

/** True if the slot on that date has already started (hospital time). */
export function isSlotPast(date: string, slot: string, now = hospitalNow()): boolean {
  if (date < now.date) return true;
  if (date > now.date) return false;
  return slotMinutes(slot) <= now.minutes;
}

export function bookingWindow(now = hospitalNow()) {
  return {
    today: now.date,
    tomorrow: addDays(now.date, 1),
    maxDate: addDays(now.date, MAX_DAYS_AHEAD),
  };
}

/**
 * Checks the date and slot rules for a booking. Returns an error message, or null if valid.
 * Doctor availability and double booking are checked separately by the caller.
 */
export function checkDateAndSlot(
  date: string,
  slot: string,
  bookingType: "normal" | "tatkal",
  now = hospitalNow(),
): string | null {
  if (!isValidDate(date)) return "Please choose a valid date.";
  if (!(TIME_SLOTS as readonly string[]).includes(slot)) return "Please choose one of the listed time slots.";

  const { today, tomorrow, maxDate } = bookingWindow(now);
  if (bookingType === "tatkal" && date !== tomorrow) {
    return "Tatkal bookings are only available for tomorrow.";
  }
  if (date < today) return "You can't book a date in the past.";
  if (date > maxDate) return `Bookings can be made up to ${MAX_DAYS_AHEAD} days ahead.`;
  if (isSlotPast(date, slot, now)) return "That time slot has already passed.";
  return null;
}
