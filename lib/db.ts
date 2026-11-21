import { Pool, type PoolClient, types } from "pg";

// Neon returns BIGINT as a string by default. Timestamps are milliseconds
// (well inside Number.MAX_SAFE_INTEGER), so parse int8 as Number.
types.setTypeParser(20, (value) => Number(value));

let pool: Pool | undefined;

export function db(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing.");
  }

  pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
    ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  });

  return pool;
}

export async function one<T>(text: string, params?: unknown[]): Promise<T | undefined> {
  const result = await db().query(text, params);
  return result.rows[0] as T | undefined;
}

export async function many<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await db().query(text, params);
  return result.rows as T[];
}

export async function run(text: string, params?: unknown[]): Promise<number> {
  const result = await db().query(text, params);
  return result.rowCount ?? 0;
}

export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
