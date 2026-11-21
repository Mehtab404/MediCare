import bcrypt from "bcryptjs";
import { z } from "zod";
import { config } from "../config.ts";
import { pool } from "../db.ts";
import type { Role } from "../auth.ts";

export const BCRYPT_ROUNDS = 11;

export const userIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,32}$/, "User ID must be 3-32 characters: letters, numbers, dot, dash or underscore.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

export type UserRow = { id: number; user_id: string; full_name: string; role: Role; password_hash: string };

/** API shape for an account. Never includes the password hash. */
export function toUser(row: Pick<UserRow, "id" | "user_id" | "full_name" | "role">) {
  return { id: row.id, userId: row.user_id, fullName: row.full_name, role: row.role };
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Creates the first admin from ADMIN_USER_ID and ADMIN_PASSWORD if that account doesn't exist yet. */
export async function ensureAdmin() {
  const { adminUserId, adminPassword } = config;
  if (!adminUserId || !adminPassword) return;

  const parsed = userIdSchema.safeParse(adminUserId);
  const pw = passwordSchema.safeParse(adminPassword);
  if (!parsed.success || !pw.success) {
    console.warn("ADMIN_USER_ID or ADMIN_PASSWORD is invalid. Skipping admin creation.");
    return;
  }

  const hash = await hashPassword(adminPassword);
  const { rowCount } = await pool.query(
    `INSERT INTO users (user_id, full_name, password_hash, role) VALUES ($1, 'Administrator', $2, 'admin')
     ON CONFLICT (user_id) DO NOTHING`,
    [parsed.data, hash],
  );
  if (rowCount) console.log(`Created admin account "${parsed.data}".`);
}

/**
 * Creates a patient account from DEMO_USER_ID and DEMO_PASSWORD if that account doesn't exist yet.
 * It is a normal patient account with no extra rights. An existing account is never changed, so a password
 * or User ID you already use is left alone.
 */
export async function ensureDemoUser() {
  const { demoUserId, demoPassword } = config;
  if (!demoUserId || !demoPassword) return;

  const parsed = userIdSchema.safeParse(demoUserId);
  const pw = passwordSchema.safeParse(demoPassword);
  if (!parsed.success || !pw.success) {
    console.warn("DEMO_USER_ID or DEMO_PASSWORD is invalid. Skipping demo account creation.");
    return;
  }

  const hash = await hashPassword(demoPassword);
  const { rowCount } = await pool.query(
    `INSERT INTO users (user_id, full_name, password_hash, role) VALUES ($1, 'Demo Patient', $2, 'patient')
     ON CONFLICT (user_id) DO NOTHING`,
    [parsed.data, hash],
  );
  if (rowCount) console.log(`Created demo patient account "${parsed.data}".`);
}
