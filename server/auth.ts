import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.ts";
import { HttpError } from "./lib/http.ts";

export const SESSION_COOKIE = "medicare_session";
const SESSION_DAYS = 7;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      patientId?: number;
    }
  }
}

export function setSession(res: Response, patientId: number) {
  const token = jwt.sign({ sub: String(patientId) }, config.jwtSecret, {
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

/** Reads the session cookie. Returns the patient id, or null if missing or invalid. */
export function readSession(req: Request): number | null {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string") return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    const id = typeof payload === "object" ? Number(payload.sub) : NaN;
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const patientId = readSession(req);
  if (!patientId) {
    throw new HttpError(401, "Please log in to continue.");
  }
  req.patientId = patientId;
  next();
}

/** Use inside routes guarded by requireAuth. */
export function currentPatientId(req: Request): number {
  if (!req.patientId) throw new HttpError(401, "Please log in to continue.");
  return req.patientId;
}
