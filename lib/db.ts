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
    CREATE TABLE IF NOT EXISTS preparations (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES profiles(account_id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS preparations_owner ON preparations(account_id, created_at);
    CREATE TABLE IF NOT EXISTS target_job_versions (
      preparation_id TEXT NOT NULL REFERENCES preparations(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      PRIMARY KEY (preparation_id, version)
    );
    CREATE TABLE IF NOT EXISTS cv_versions (
      id TEXT PRIMARY KEY,
      preparation_id TEXT NOT NULL REFERENCES preparations(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      filename TEXT NOT NULL,
      source BLOB NOT NULL,
      evidence_json TEXT NOT NULL,
      UNIQUE (preparation_id, version)
    );
  `);
  database = connection;
  return connection;
}
