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
