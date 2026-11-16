import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { query } from "../db.ts";
import { clearSession, readSession, setSession } from "../auth.ts";
import { HttpError, isPgError, PG_UNIQUE_VIOLATION } from "../lib/http.ts";

const BCRYPT_ROUNDS = 11;
// Compared against when the user doesn't exist, so a missing user takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

const userIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,32}$/, "User ID must be 3-32 characters: letters, numbers, dot, dash or underscore.");

const registerSchema = z.object({
  userId: userIdSchema,
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80, "Name is too long."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128, "Password is too long."),
});

const loginSchema = z.object({
  userId: z.string().trim().toLowerCase().min(1, "Please enter your User ID."),
  password: z.string().min(1, "Please enter your password."),
});

type PatientRow = { id: number; user_id: string; full_name: string; password_hash: string };

function toPatient(row: Pick<PatientRow, "id" | "user_id" | "full_name">) {
  return { id: row.id, userId: row.user_id, fullName: row.full_name };
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

export const authRouter = Router();

authRouter.post("/register", authLimiter, async (req, res) => {
  const { userId, fullName, password } = registerSchema.parse(req.body);
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    const { rows } = await query<PatientRow>(
      `INSERT INTO patients (user_id, full_name, password_hash) VALUES ($1, $2, $3)
       RETURNING id, user_id, full_name`,
      [userId, fullName, hash],
    );
    setSession(res, rows[0].id);
    res.status(201).json({ patient: toPatient(rows[0]) });
  } catch (err) {
    if (isPgError(err, PG_UNIQUE_VIOLATION)) {
      throw new HttpError(409, "That User ID is already taken.");
    }
    throw err;
  }
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const { userId, password } = loginSchema.parse(req.body);
  const { rows } = await query<PatientRow>(
    "SELECT id, user_id, full_name, password_hash FROM patients WHERE user_id = $1",
    [userId],
  );
  const patient = rows[0];
  const ok = await bcrypt.compare(password, patient?.password_hash ?? DUMMY_HASH);
  if (!patient || !ok) {
    throw new HttpError(401, "Incorrect User ID or password.");
  }
  setSession(res, patient.id);
  res.json({ patient: toPatient(patient) });
});

authRouter.post("/logout", (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

authRouter.get("/me", async (req, res) => {
  const patientId = readSession(req);
  if (!patientId) throw new HttpError(401, "Not logged in.");
  const { rows } = await query<PatientRow>("SELECT id, user_id, full_name FROM patients WHERE id = $1", [patientId]);
  if (!rows[0]) {
    clearSession(res);
    throw new HttpError(401, "Not logged in.");
  }
  res.json({ patient: toPatient(rows[0]) });
});
