import { db } from "./db";

export type KeywordStatus = "have" | "learning" | "missing";
export type Confirmation = { term: string; status: KeywordStatus; detail: string };

export function readKeywordConfirmations(account: string, id: string, jobVersion: number) {
  const rows = db().prepare(`
    SELECT c.term, c.status, c.detail
    FROM keyword_confirmations c JOIN preparations p ON p.id = c.preparation_id
    WHERE p.account_id = ? AND p.id = ? AND c.job_version = ?
  `).all(account, id, jobVersion) as Confirmation[];
  return rows.map((row) => ({ ...row }));
}

export function saveKeywordConfirmation(account: string, id: string, jobVersion: number, cvVersion: number, entry: Confirmation) {
  return db().prepare(`
    INSERT INTO keyword_confirmations (preparation_id, job_version, term, status, detail)
    SELECT p.id, ?, ?, ?, ? FROM preparations p JOIN listing_snapshots s ON s.preparation_id = p.id
    WHERE p.account_id = ? AND p.id = ?
      AND ? = (SELECT MAX(version) FROM target_job_versions WHERE preparation_id = p.id)
      AND ? = (SELECT MAX(version) FROM cv_versions WHERE preparation_id = p.id)
    ON CONFLICT (preparation_id, job_version, term)
    DO UPDATE SET status = excluded.status, detail = excluded.detail
  `).run(jobVersion, entry.term, entry.status, entry.detail, account, id, jobVersion, cvVersion).changes === 1;
}
