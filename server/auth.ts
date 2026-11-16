import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.ts";
import { query } from "./db.ts";
import { HttpError } from "./lib/http.ts";

export const SESSION_COOKIE = "medicare_session";
const SESSION_DAYS = 7;

export type Role = "patient" | "doctor" | "admin";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Id of the logged-in account (any role). Set by requireAuth and requireRole. */
      patientId?: number;
      /** Role of the logged-in account, read from the database. */
      userRole?: Role;
    }
  }
}

export function setSession(res: Response, userId: number) {
  // "ts" is the issue time in milliseconds. The standard "iat" claim only has whole seconds, which is too coarse
  // to tell a session opened just before a password change from one opened just after it.
  const token = jwt.sign({ sub: String(userId), ts: Date.now() }, config.jwtSecret, {
    expiresIn: `${SESSION_DAYS}d`,
    algorithm: "HS256",
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSession(res: Response) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    path: "/",
  });
}

export interface SessionUser {
  id: number;
  role: Role;
}

/**
 * Who the session cookie belongs to, or null. The cookie is checked against the database on every call:
 * the account must still exist, and the cookie must be newer than the last password change,
 * so changing or resetting a password signs out every other device.
 */
export async function loadSession(req: Request): Promise<SessionUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string") return null;

  let id: number;
  let issuedAtMs: number;
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    if (typeof payload !== "object") return null;
    id = Number(payload.sub);
    // Cookies issued before "ts" existed only have whole seconds.
    issuedAtMs = typeof payload.ts === "number" ? payload.ts : Number(payload.iat) * 1000;
  } catch {
    return null;
  }
  if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(issuedAtMs)) return null;

  const { rows } = await query<{ role: Role; password_changed_at: Date | null }>(
    "SELECT role, password_changed_at FROM users WHERE id = $1",
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  if (row.password_changed_at && issuedAtMs < row.password_changed_at.getTime()) return null;
  return { id, role: row.role };
}

/** Any logged-in account. Use requireRole when the route belongs to one kind of account. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const session = await loadSession(req);
  if (!session) throw new HttpError(401, "Please log in to continue.");
  req.patientId = session.id;
  req.userRole = session.role;
  next();
}

/** Logged in and holding one of the given roles. A role change or a deleted account takes effect immediately. */
export function requireRole(...roles: Role[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const session = await loadSession(req);
    if (!session) throw new HttpError(401, "Please log in to continue.");
    if (!roles.includes(session.role)) throw new HttpError(403, "You don't have access to this.");
    req.patientId = session.id;
    req.userRole = session.role;
    next();
  };
}

/** Use inside routes guarded by requireAuth or requireRole. */
export function currentUserId(req: Request): number {
  if (!req.patientId) throw new HttpError(401, "Please log in to continue.");
  return req.patientId;
}

/** Same as currentUserId. Kept so patient routes read naturally. */
export const currentPatientId = currentUserId;
