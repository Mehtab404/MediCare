function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. See .env.example.`);
  }
  return value;
}

function optional(name: string): string | null {
  return process.env[name]?.trim() || null;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";
const jwtSecret = required("JWT_SECRET");

if (isProduction && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production.");
}

/**
 * Email delivery:
 * - "smtp": SMTP_HOST is set. Works with any provider that offers SMTP (Resend, SendGrid, Gmail, ...).
 * - "log":  no SMTP_HOST outside production. Emails are printed to the server log so you can develop without a provider.
 * - "off":  no SMTP_HOST in production. Nothing is sent, and features that need email say so.
 */
const smtpHost = optional("SMTP_HOST");
const smtpUser = optional("SMTP_USER");
const smtpPassword = process.env.SMTP_PASSWORD || null;
const emailFrom = optional("EMAIL_FROM");

if (smtpHost && !emailFrom) {
  throw new Error("EMAIL_FROM is required when SMTP_HOST is set, for example: MediCare <no-reply@yourdomain.com>");
}
if (Boolean(smtpUser) !== Boolean(smtpPassword)) {
  throw new Error("Set both SMTP_USER and SMTP_PASSWORD, or neither.");
}

export const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: required("DATABASE_URL"),
  databaseSsl: process.env.DATABASE_SSL === "true",
  jwtSecret,
  /** Optional. When both are set, an admin account with this User ID is created on start if it doesn't exist. */
  adminUserId: process.env.ADMIN_USER_ID?.trim().toLowerCase() || null,
  adminPassword: process.env.ADMIN_PASSWORD || null,
  /** Optional. When both are set, a patient account with this User ID is created on start if it doesn't exist. */
  demoUserId: process.env.DEMO_USER_ID?.trim().toLowerCase() || null,
  demoPassword: process.env.DEMO_PASSWORD || null,
  /** Hospital time zone. Used to decide what "today" and "now" mean for bookings. */
  timeZone: "Asia/Kolkata",
  /** Public address of the site, used for links in emails. On Render this falls back to the service URL. */
  appUrl: (optional("APP_URL") ?? optional("RENDER_EXTERNAL_URL") ?? "http://localhost:8080").replace(/\/+$/, ""),
  mail: {
    mode: (smtpHost ? "smtp" : isProduction ? "off" : "log") as "smtp" | "log" | "off",
    from: emailFrom ?? "MediCare <no-reply@medicare.local>",
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 587),
    /** true for port 465. Port 587 upgrades the connection with STARTTLS instead. */
    secure: process.env.SMTP_SECURE === "true",
    user: smtpUser,
    password: smtpPassword,
  },
};
