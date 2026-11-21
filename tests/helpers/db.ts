import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

export function getTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set to run integration tests.");
  }
  const parsed = new URL(url);
  const isLocal =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "::1";

  if (!isLocal && process.env.ALLOW_REMOTE_TEST_DB !== "1") {
    throw new Error(
      `Refusing to run tests on non-local database host (${parsed.hostname}). Set ALLOW_REMOTE_TEST_DB=1 to override.`,
    );
  }
  return url;
}

export async function resetDatabase() {
  const url = getTestDatabaseUrl();
  process.env.DATABASE_URL = url;

  const client = new Client({
    connectionString: url,
    ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();
  try {
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    const migrationFile = path.resolve(__dirname, "../../migrations/0001_init.sql");
    const sql = fs.readFileSync(migrationFile, "utf-8");
    await client.query(sql);
  } finally {
    await client.end();
  }
}
