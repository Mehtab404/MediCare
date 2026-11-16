/** An error with an HTTP status. Its message is safe to show to the client. */
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Postgres error code for a unique constraint violation. */
export const PG_UNIQUE_VIOLATION = "23505";

export function isPgError(err: unknown, code: string): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === code;
}
