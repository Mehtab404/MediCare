import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { query, withTransaction } from "../db.ts";
import { clearSession, currentUserId, loadSession, requireAuth, setSession } from "../auth.ts";
import { HttpError, isPgError, PG_UNIQUE_VIOLATION } from "../lib/http.ts";
import { BCRYPT_ROUNDS, hashPassword, passwordSchema, toUser, userIdSchema, type UserRow } from "../lib/users.ts";
import { emailEnabled } from "../lib/mailer.ts";
import { hashToken, notifyPasswordChanged, sendPasswordResetLink } from "../lib/securityMail.ts";

// Compared against when the user doesn't exist, so a missing user takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

const registerSchema = z.object({
  userId: userIdSchema,
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80, "Name is too long."),
  password: passwordSchema,
});

const loginSchema = z.object({
  userId: z.string().trim().toLowerCase().min(1, "Please enter your User ID."),
  password: z.string().min(1, "Please enter your password."),
});

const forgotSchema = z.object({
  identifier: z
    .string({ required_error: "Please enter your User ID or email." })
    .trim()
    .toLowerCase()
    .min(1, "Please enter your User ID or email.")
    .max(254, "That is too long."),
});

const resetSchema = z.object({
  token: z.string({ required_error: "This link is incomplete." }).min(20, "This link is incomplete.").max(200, "This link is incomplete."),
  password: passwordSchema,
});

const changeSchema = z.object({
  currentPassword: z.string({ required_error: "Please enter your current password." }).min(1, "Please enter your current password."),
  newPassword: passwordSchema,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

export const authRouter = Router();

/** Public registration always creates a patient. Doctor and admin accounts are created by an admin. */
authRouter.post("/register", authLimiter, async (req, res) => {
  const { userId, fullName, password } = registerSchema.parse(req.body);
  const hash = await hashPassword(password);
  try {
    const { rows } = await query<UserRow>(
      `INSERT INTO users (user_id, full_name, password_hash, role) VALUES ($1, $2, $3, 'patient')
       RETURNING id, user_id, full_name, role`,
      [userId, fullName, hash],
    );
    setSession(res, rows[0].id);
    res.status(201).json({ user: toUser(rows[0]) });
  } catch (err) {
    if (isPgError(err, PG_UNIQUE_VIOLATION)) {
      throw new HttpError(409, "That User ID is already taken.");
    }
    throw err;
  }
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const { userId, password } = loginSchema.parse(req.body);
  const { rows } = await query<UserRow>(
    "SELECT id, user_id, full_name, role, password_hash FROM users WHERE user_id = $1",
    [userId],
  );
  const user = rows[0];
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    throw new HttpError(401, "Incorrect User ID or password.");
  }
  setSession(res, user.id);
  res.json({ user: toUser(user) });
});

authRouter.post("/logout", (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

authRouter.get("/me", async (req, res) => {
  const session = await loadSession(req);
  if (!session) {
    clearSession(res);
    throw new HttpError(401, "Not logged in.");
  }
  const { rows } = await query<UserRow>("SELECT id, user_id, full_name, role FROM users WHERE id = $1", [session.id]);
  res.json({ user: toUser(rows[0]) });
});

/**
 * Emails a reset link to the account's confirmed address, if there is one. The answer is the same
 * whether or not the account exists or has an address, so this can't be used to look up who has an account.
 */
authRouter.post("/forgot-password", authLimiter, async (req, res) => {
  const { identifier } = forgotSchema.parse(req.body);
  if (!emailEnabled) {
    throw new HttpError(503, "Email isn't set up on this server yet, so a reset link can't be sent. Please contact the hospital.");
  }
  const { rows } = await query<{ id: number; email: string; full_name: string }>(
    `SELECT id, email, full_name FROM users
     WHERE (user_id = $1 OR lower(email) = $1) AND email IS NOT NULL AND email_verified_at IS NOT NULL`,
    [identifier],
  );
  // Sent in the background so a missing account doesn't answer faster than an existing one.
  if (rows[0]) void sendPasswordResetLink({ id: rows[0].id, email: rows[0].email, full_name: rows[0].full_name });
  res.json({ message: "If that account has a confirmed email address, we've sent a reset link to it. The link works for one hour." });
});

/** Sets a new password from the emailed link. Signs the account out everywhere. */
authRouter.post("/reset-password", authLimiter, async (req, res) => {
  const { token, password } = resetSchema.parse(req.body);
  const hash = await hashPassword(password);

  const userId = await withTransaction(async (client) => {
    const found = await client.query<{ user_id: number }>(
      "SELECT user_id FROM password_resets WHERE token_hash = $1 AND expires_at > now() FOR UPDATE",
      [hashToken(token)],
    );
    const row = found.rows[0];
    if (!row) throw new HttpError(400, "This link is invalid or has expired. Please ask for a new one.");
    await client.query("UPDATE users SET password_hash = $2, password_changed_at = $3 WHERE id = $1", [row.user_id, hash, new Date()]);
    await client.query("DELETE FROM password_resets WHERE user_id = $1", [row.user_id]);
    return row.user_id;
  });

  clearSession(res);
  void notifyPasswordChanged(userId);
  res.json({ ok: true });
});

/** For a logged-in account of any role. Other devices are signed out; this one stays signed in. */
authRouter.post("/change-password", authLimiter, requireAuth, async (req, res) => {
  const userId = currentUserId(req);
  const { currentPassword, newPassword } = changeSchema.parse(req.body);

  const { rows } = await query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [userId]);
  if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
    throw new HttpError(400, "Your current password is incorrect.");
  }
  if (currentPassword === newPassword) {
    throw new HttpError(400, "Your new password must be different from the current one.");
  }

  await query("UPDATE users SET password_hash = $2, password_changed_at = $3 WHERE id = $1", [
    userId,
    await hashPassword(newPassword),
    new Date(),
  ]);
  await query("DELETE FROM password_resets WHERE user_id = $1", [userId]);
  setSession(res, userId);
  void notifyPasswordChanged(userId);
  res.json({ ok: true });
});
