import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "../config.ts";
import { query, withTransaction } from "../db.ts";
import { currentUserId, requireRole } from "../auth.ts";
import { HttpError, isPgError, PG_UNIQUE_VIOLATION } from "../lib/http.ts";
import { emailEnabled, sendMail } from "../lib/mailer.ts";

const TOKEN_HOURS = 24;
const RESEND_COOLDOWN_SECONDS = 60;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const emailSchema = z.object({
  email: z
    .string({ required_error: "Please enter your email address." })
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .max(254, "That email address is too long."),
});

const verifySchema = z.object({
  token: z.string({ required_error: "This link is incomplete." }).min(20, "This link is incomplete.").max(200, "This link is incomplete."),
});

type AccountRow = { email: string | null; email_verified_at: Date | null; full_name: string };

async function loadAccount(userId: number): Promise<AccountRow> {
  const { rows } = await query<AccountRow>("SELECT email, email_verified_at, full_name FROM users WHERE id = $1", [userId]);
  if (!rows[0]) throw new HttpError(401, "Please log in to continue.");
  return rows[0];
}

function toState(row: AccountRow) {
  return { email: row.email, emailVerified: row.email !== null && row.email_verified_at !== null, emailEnabled };
}

const changeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  // Per IP, and patients on the hospital's Wi-Fi share one. The per-account cooldown below is the tighter limit.
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many email changes. Please try again later." },
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

export const accountRouter = Router();

/** The patient's notification address and whether it is verified. */
accountRouter.get("/", requireRole("patient"), async (req, res) => {
  res.json(toState(await loadAccount(currentUserId(req))));
});

/**
 * Sets the notification address and emails a confirmation link. Nothing is sent to the address
 * (other than that link) until the patient has followed it.
 */
accountRouter.put("/email", requireRole("patient"), changeLimiter, async (req, res) => {
  const userId = currentUserId(req);
  const { email } = emailSchema.parse(req.body);
  if (!emailEnabled) throw new HttpError(503, "Email isn't set up on this server yet, so an address can't be confirmed.");

  const account = await loadAccount(userId);
  if (account.email === email && account.email_verified_at) {
    res.json(toState(account));
    return;
  }

  const recent = await query(
    `SELECT 1 FROM email_verifications WHERE user_id = $1 AND created_at > now() - make_interval(secs => $2)`,
    [userId, RESEND_COOLDOWN_SECONDS],
  );
  if (recent.rows.length > 0) {
    throw new HttpError(429, "A confirmation email was just sent. Please wait a minute before asking for another.");
  }

  const token = randomBytes(32).toString("base64url");
  await withTransaction(async (client) => {
    await client.query("UPDATE users SET email = $2, email_verified_at = NULL WHERE id = $1", [userId, email]);
    await client.query("DELETE FROM email_verifications WHERE user_id = $1", [userId]);
    await client.query(
      `INSERT INTO email_verifications (user_id, email, token_hash, expires_at)
       VALUES ($1, $2, $3, now() + make_interval(hours => $4))`,
      [userId, email, hashToken(token), TOKEN_HOURS],
    );
  });

  try {
    await sendMail({
      to: email,
      subject: "Confirm your email for MediCare",
      text:
        `Hello ${account.full_name.split(/\s+/)[0]},\n\n` +
        `Open this link to confirm that you want MediCare appointment emails at this address.\n` +
        `It works once and expires in ${TOKEN_HOURS} hours:\n\n` +
        `${config.appUrl}/verify-email?token=${token}\n\n` +
        `If you didn't ask for this, ignore this email. Nothing will be sent to you.\n`,
    });
  } catch (err) {
    // Clear the link so the patient can try again straight away instead of waiting out the cooldown.
    await query("DELETE FROM email_verifications WHERE user_id = $1", [userId]);
    console.error("Could not send the verification email:", err instanceof Error ? err.message : err);
    throw new HttpError(502, "We couldn't send the confirmation email. Please check the address and try again.");
  }

  res.json(toState({ ...account, email, email_verified_at: null }));
});

/** Stops all emails by removing the address. */
accountRouter.delete("/email", requireRole("patient"), async (req, res) => {
  const userId = currentUserId(req);
  await withTransaction(async (client) => {
    await client.query("UPDATE users SET email = NULL, email_verified_at = NULL WHERE id = $1", [userId]);
    await client.query("DELETE FROM email_verifications WHERE user_id = $1", [userId]);
  });
  res.json(toState(await loadAccount(userId)));
});

/**
 * Follows the link from the email. The token is the proof, so no login is needed (the link is often
 * opened on another device). A link only counts while the account still has the address it was sent to.
 */
accountRouter.post("/email/verify", verifyLimiter, async (req, res) => {
  const { token } = verifySchema.parse(req.body);
  const invalid = "This link is invalid or has expired. You can ask for a new one on your Health Profile page.";

  try {
    const email = await withTransaction(async (client) => {
      const found = await client.query<{ user_id: number; email: string }>(
        `SELECT v.user_id, v.email FROM email_verifications v
         JOIN users u ON u.id = v.user_id
         WHERE v.token_hash = $1 AND v.expires_at > now() AND lower(u.email) = lower(v.email)
         FOR UPDATE OF v`,
        [hashToken(token)],
      );
      const row = found.rows[0];
      if (!row) throw new HttpError(400, invalid);
      await client.query("UPDATE users SET email_verified_at = now() WHERE id = $1", [row.user_id]);
      await client.query("DELETE FROM email_verifications WHERE user_id = $1", [row.user_id]);
      return row.email;
    });
    res.json({ verified: true, email });
  } catch (err) {
    if (isPgError(err, PG_UNIQUE_VIOLATION)) {
      throw new HttpError(409, "That email address is already confirmed on another account.");
    }
    throw err;
  }
});
