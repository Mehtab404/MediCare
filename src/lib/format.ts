/** "14:30" -> "2:30 PM" */
export function formatTime(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/**
 * Formats a "YYYY-MM-DD" date. The date is read as a calendar date (noon UTC),
 * so it shows the same day in every browser time zone.
 */
export function formatDate(date: string, style: "long" | "short" = "short"): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-IN", {
    timeZone: "UTC",
    weekday: style,
    year: "numeric",
    month: style,
    day: "numeric",
  });
}

/** "Dr. Amit Sharma" -> "AS" */
export function initials(name: string): string {
  return name
    .replace(/^dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

/** "No reviews yet" or "4.5 (2 reviews)". Ratings come from real patient reviews. */
export function ratingLabel(rating: number, reviews: number): string {
  if (reviews === 0) return "No reviews yet";
  return `${rating.toFixed(1)} (${reviews} review${reviews === 1 ? "" : "s"})`;
}

/** Age in whole years from a "YYYY-MM-DD" date of birth. */
export function ageFromDob(dob: string, today = new Date()): number {
  const [y, m, d] = dob.split("-").map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age;
}

/** Formats an ISO timestamp as a date in the hospital's time zone. */
export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" });
}
