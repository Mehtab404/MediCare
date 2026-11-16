import { createHash, randomBytes } from "node:crypto";
import { config } from "../config.ts";
import { query } from "../db.ts";
import { sendMail } from "./mailer.ts";

export const RESET_HOURS = 1;
const RESEND_COOLDOWN_SECONDS = 60;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const log = (what: string, err: unknown) => console.error(`${what}:`, err instanceof Error ? err.message : err);

/**
 * Emails a reset link to the account's confirmed address. Does nothing if a link went out in the last minute.
 * Never throws, so the caller's response looks the same whether or not an email was sent.
 */
export async function sendPasswordResetLink(user: { id: number; email: string; full_name: string }): Promise<void> {
  try {
    const recent = await query(
      "SELECT 1 FROM password_resets WHERE user_id = $1 AND created_at > now() - make_interval(secs => $2)",
      [user.id, RESEND_COOLDOWN_SECONDS],
    );
    if (recent.rows.length > 0) return;

    const token = randomBytes(32).toString("base64url");
    await query("DELETE FROM password_resets WHERE user_id = $1", [user.id]);
    await query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, now() + make_interval(hours => $3))`,
      [user.id, hashToken(token), RESET_HOURS],
    );
    await sendMail({
      to: user.email,
      subject: "Reset your MediCare password",
      text:
        `Hello ${user.full_name.split(/\s+/)[0]},\n\n` +
        `Someone asked to reset the password for your MediCare account. Open this link to choose a new one.\n` +
        `It works once and expires in ${RESET_HOURS} hour:\n\n` +
        `${config.appUrl}/reset-password?token=${token}\n\n` +
        `If this wasn't you, ignore this email. Your password has not changed.\n`,
    });
  } catch (err) {
    log("Could not send the password reset email", err);
  }
}

/** Tells the account holder their password just changed, so a change they didn't make doesn't go unnoticed. */
export async function notifyPasswordChanged(userId: number): Promise<void> {
  try {
    const { rows } = await query<{ email: string; full_name: string }>(
      "SELECT email, full_name FROM users WHERE id = $1 AND email IS NOT NULL AND email_verified_at IS NOT NULL",
      [userId],
    );
    if (!rows[0]) return;
    await sendMail({
      to: rows[0].email,
      subject: "Your MediCare password was changed",
      text:
        `Hello ${rows[0].full_name.split(/\s+/)[0]},\n\n` +
        `The password for your MediCare account was just changed, and you were signed out on other devices.\n\n` +
        `If this was you, there is nothing to do. If it wasn't, reset your password now: ${config.appUrl}/forgot-password\n`,
    });
  } catch (err) {
    log("Could not send the password changed email", err);
  }
}
