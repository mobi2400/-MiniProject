import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

let database: DatabaseSync | undefined;

export function db() {
  if (database) return database;
  // The database lives on the runtime volume and must stay outside the build.
  const path = resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH || ".data/miniproject.sqlite");
  mkdirSync(dirname(path), { recursive: true });
  const connection = new DatabaseSync(path, { timeout: 5000 });
  connection.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profiles (
      account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      career_goal TEXT NOT NULL
    );
  `);
  database = connection;
  return connection;
}
