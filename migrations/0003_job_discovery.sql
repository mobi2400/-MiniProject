CREATE TABLE IF NOT EXISTS job_discovery_cache (
  cache_key TEXT PRIMARY KEY,
  results_json TEXT NOT NULL,
  fetched_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_discovery_usage (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  searches INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, day)
);