import { many, run } from "./db";

export type KeywordStatus = "have" | "learning" | "missing";
export type Confirmation = { term: string; status: KeywordStatus; detail: string };

export async function readKeywordConfirmations(account: string, id: string, jobVersion: number): Promise<Confirmation[]> {
  const rows = await many<Confirmation>(
    `
    SELECT c.term, c.status, c.detail
    FROM keyword_confirmations c JOIN preparations p ON p.id = c.preparation_id
    WHERE p.account_id = $1 AND p.id = $2 AND c.job_version = $3
    `,
    [account, id, jobVersion],
  );
  return rows.map((row) => ({ ...row }));
}

export async function saveKeywordConfirmation(
  account: string,
  id: string,
  jobVersion: number,
  cvVersion: number,
  entry: Confirmation,
): Promise<boolean> {
  const count = await run(
    `
    INSERT INTO keyword_confirmations (preparation_id, job_version, term, status, detail)
    SELECT p.id, $1, $2, $3, $4 FROM preparations p JOIN listing_snapshots s ON s.preparation_id = p.id
    WHERE p.account_id = $5 AND p.id = $6
      AND $7 = (SELECT MAX(version) FROM target_job_versions WHERE preparation_id = p.id)
      AND $8 = (SELECT MAX(version) FROM cv_versions WHERE preparation_id = p.id)
    ON CONFLICT (preparation_id, job_version, term)
    DO UPDATE SET status = excluded.status, detail = excluded.detail
    `,
    [jobVersion, entry.term, entry.status, entry.detail, account, id, jobVersion, cvVersion],
  );
  return count === 1;
}
