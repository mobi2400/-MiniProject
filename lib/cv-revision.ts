import { readCv } from "./cv";
import type { Requirement } from "./cv-fit";
import { db } from "./db";
import { readTargetJob } from "./preparations";
import { hasReadiness, readReassessments } from "./training";
import { hasCoverage } from "./training-bank";

export function readCvRevision(account: string, id: string) {
  const job = readTargetJob(account, id);
  const cv = readCv(account, id);
  if (!job || !cv || !hasReadiness(readReassessments(account, id, job.version))) return null;
  const report = db().prepare(`
    SELECT items_json FROM cv_comparisons c JOIN preparations p ON p.id = c.preparation_id
    WHERE p.account_id = ? AND p.id = ? AND c.cv_version = ? AND c.job_version = ?
  `).get(account, id, cv.version, job.version) as { items_json: string } | undefined;
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

export function readCvSource(account: string, id: string, version: number) {
  return db().prepare(`
    SELECT c.source FROM cv_versions c JOIN preparations p ON p.id = c.preparation_id
    WHERE p.account_id = ? AND p.id = ? AND c.version = ?
  `).get(account, id, version) as { source: Uint8Array } | undefined;
}

export function renderCvRevision(original: string, excerpts: { section: string; excerpt: string }[]) {
  if (!excerpts.length) return original;
  const highlights = excerpts.map(({ section, excerpt }) => `- ${section}: ${excerpt}`).join("\n");
  return `Relevant highlights\n${highlights}\n\n${original}`;
}
