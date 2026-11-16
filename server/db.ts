import pg from "pg";
import { config } from "./config.ts";

// Return DATE columns as "YYYY-MM-DD" strings instead of JS Dates,
// so no time zone shifting happens between the database and the client.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);
// Return NUMERIC columns (doctor rating) as numbers.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => Number(value));

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

export async function query<T extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  return pool.query<T>(text, params);
}
