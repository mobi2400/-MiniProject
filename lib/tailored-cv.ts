import { analyzeKeywords } from "./ats-keywords";
import type { CvEvidence } from "./cv-text";
import { one, run } from "./db";
import type { Confirmation } from "./keyword-confirmations";

export type TailoredEdit = {
  terms: string[];
  section: string;
  text: string;
  source: { type: "cv"; line: number } | { type: "confirmation"; term: string };
};

export function buildTailoredEdits(description: string, evidence: CvEvidence[], confirmations: Confirmation[]) {
  const edits = new Map<string, TailoredEdit>();
  for (const { term, source } of analyzeKeywords(description, evidence).keywords) {
    if (source) {
      const key = `line:${source.line}`;
      const existing = edits.get(key);
      if (existing) existing.terms.push(term);
      else
        edits.set(key, {
          terms: [term],
          section: source.section,
          text: source.excerpt,
          source: { type: "cv", line: source.line },
        });
      continue;
    }
    const confirmed = confirmations.find((entry) => entry.term === term && entry.status === "have");
    if (confirmed)
      edits.set(`claim:${term}`, {
        terms: [term],
        section: "Confirmed skills",
        text: confirmed.detail,
        source: { type: "confirmation", term },
      });
  }
  return [...edits.values()];
}

export async function readTailoredDraft(account: string, id: string) {
  const row = await one<{ cv_version: number; job_version: number; edits_json: string; generated_at: number }>(
    `
    SELECT d.cv_version, d.job_version, d.edits_json, d.generated_at
    FROM tailored_cv_drafts d JOIN preparations p ON p.id = d.preparation_id
    WHERE p.id = $1 AND p.account_id = $2
    `,
    [id, account],
  );
  return (
    row && {
      cvVersion: row.cv_version,
      jobVersion: row.job_version,
      edits: JSON.parse(row.edits_json) as TailoredEdit[],
      generatedAt: row.generated_at,
    }
  );
}

export async function saveTailoredDraft(
  account: string,
  id: string,
  jobVersion: number,
  cvVersion: number,
  edits: TailoredEdit[],
) {
  const count = await run(
    `
    INSERT INTO tailored_cv_drafts (preparation_id, job_version, cv_version, edits_json, generated_at)
    SELECT p.id, $1, $2, $3, $4 FROM preparations p JOIN listing_snapshots s ON s.preparation_id = p.id
    WHERE p.account_id = $5 AND p.id = $6
      AND $7 = (SELECT MAX(version) FROM target_job_versions WHERE preparation_id = p.id)
      AND $8 = (SELECT MAX(version) FROM cv_versions WHERE preparation_id = p.id)
    ON CONFLICT (preparation_id) DO UPDATE SET
      job_version = excluded.job_version, cv_version = excluded.cv_version,
      edits_json = excluded.edits_json, generated_at = excluded.generated_at
    `,
    [jobVersion, cvVersion, JSON.stringify(edits), Date.now(), account, id, jobVersion, cvVersion],
  );
  return count === 1;
}
