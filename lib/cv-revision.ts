import { readCv } from "./cv";
import type { Requirement } from "./cv-fit";
import { one } from "./db";
import { readTargetJob } from "./preparations";
import { hasReadiness, readReassessments } from "./training";
import { hasCoverage } from "./training-bank";

export async function readCvRevision(account: string, id: string) {
  const job = await readTargetJob(account, id);
  const cv = await readCv(account, id);
  if (!job || !cv) return null;
  const reassessments = await readReassessments(account, id, job.version);
  if (!hasReadiness(reassessments)) return null;

  const report = await one<{ items_json: string }>(
    `
    SELECT items_json FROM cv_comparisons c JOIN preparations p ON p.id = c.preparation_id
    WHERE p.account_id = $1 AND p.id = $2 AND c.cv_version = $3 AND c.job_version = $4
    `,
    [account, id, cv.version, job.version],
  );
  if (!report) return null;
  const requirements = JSON.parse(report.items_json) as Requirement[];
  const required = requirements.filter((item) => item.required);
  if (!required.length || required.some(({ title }) => !hasCoverage(title))) return null;
  const edits = cv.evidence.flatMap((source) => {
    const matches = requirements.filter((item) => item.evidence === String(source.line));
    return matches.length ? [{ ...source, requirements: matches.map(({ title }) => title) }] : [];
  });
  return { job, cv, edits };
}

export async function readCvSource(account: string, id: string, version: number) {
  return await one<{ source: Uint8Array | Buffer }>(
    `
    SELECT c.source FROM cv_versions c JOIN preparations p ON p.id = c.preparation_id
    WHERE p.account_id = $1 AND p.id = $2 AND c.version = $3
    `,
    [account, id, version],
  );
}

export function renderCvRevision(original: string, excerpts: { section: string; excerpt: string }[]) {
  if (!excerpts.length) return original;
  const highlights = excerpts.map(({ section, excerpt }) => `- ${section}: ${excerpt}`).join("\n");
  return `Relevant highlights\n${highlights}\n\n${original}`;
}
