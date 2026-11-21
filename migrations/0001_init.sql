CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  career_goal TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS preparations (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES profiles(account_id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL
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
  source BYTEA NOT NULL,
  evidence_json TEXT NOT NULL,
  UNIQUE (preparation_id, version)
);

CREATE TABLE IF NOT EXISTS cv_comparisons (
  preparation_id TEXT NOT NULL,
  cv_version INTEGER NOT NULL,
  job_version INTEGER NOT NULL,
  items_json TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  PRIMARY KEY (preparation_id, cv_version, job_version),
  FOREIGN KEY (preparation_id, cv_version) REFERENCES cv_versions(preparation_id, version) ON DELETE CASCADE,
  FOREIGN KEY (preparation_id, job_version) REFERENCES target_job_versions(preparation_id, version) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diagnostic_attempts (
  preparation_id TEXT NOT NULL REFERENCES preparations(id) ON DELETE CASCADE,
  job_version INTEGER NOT NULL,
  question_json TEXT NOT NULL,
  submitted_at BIGINT,
  selected_answer INTEGER,
  score INTEGER CHECK (score IN (0, 100)),
  PRIMARY KEY (preparation_id, job_version)
);

CREATE TABLE IF NOT EXISTS reassessments (
  preparation_id TEXT NOT NULL REFERENCES preparations(id) ON DELETE CASCADE,
  job_version INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  question_json TEXT NOT NULL,
  selected_answer INTEGER,
  score INTEGER CHECK (score IN (0, 100)),
  PRIMARY KEY (preparation_id, job_version, sequence),
  UNIQUE (preparation_id, job_version, question_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_reassessment
  ON reassessments(preparation_id, job_version) WHERE score IS NULL;

CREATE TABLE IF NOT EXISTS job_search_preferences (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  titles_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS listing_snapshots (
  preparation_id TEXT PRIMARY KEY REFERENCES preparations(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  url TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  captured_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS listing_checks (
  preparation_id TEXT PRIMARY KEY REFERENCES listing_snapshots(preparation_id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
  checked_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS keyword_confirmations (
  preparation_id TEXT NOT NULL,
  job_version INTEGER NOT NULL,
  term TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('have', 'learning', 'missing')),
  detail TEXT NOT NULL,
  PRIMARY KEY (preparation_id, job_version, term),
  FOREIGN KEY (preparation_id, job_version) REFERENCES target_job_versions(preparation_id, version) ON DELETE CASCADE,
  CHECK ((status = 'have' AND length(trim(detail)) > 0) OR (status <> 'have' AND detail = ''))
);

CREATE TABLE IF NOT EXISTS tailored_cv_drafts (
  preparation_id TEXT PRIMARY KEY REFERENCES listing_snapshots(preparation_id) ON DELETE CASCADE,
  job_version INTEGER NOT NULL,
  cv_version INTEGER NOT NULL,
  edits_json TEXT NOT NULL,
  generated_at BIGINT NOT NULL,
  FOREIGN KEY (preparation_id, job_version) REFERENCES target_job_versions(preparation_id, version) ON DELETE CASCADE,
  FOREIGN KEY (preparation_id, cv_version) REFERENCES cv_versions(preparation_id, version) ON DELETE CASCADE
);
