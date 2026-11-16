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

/** Runs fn inside a transaction on one connection. Commits on success, rolls back if fn throws. */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
