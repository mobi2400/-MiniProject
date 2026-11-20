"use server";

import { notFound } from "next/navigation";
import { readCv } from "../../../../lib/cv";
import { calculateCvFit, validateRequirements } from "../../../../lib/cv-fit";
import { db } from "../../../../lib/db";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";

export async function saveComparison(
  id: string,
  cvVersion: number,
  jobVersion: number,
  input: unknown,
) {
  const account = await requireAccount();
  const job = readTargetJob(account, id);
  if (!job) notFound();
  const cv = readCv(account, id);
  const stale = { error: "The CV or job changed. Reload the page to compare the latest versions." };
  if (cv?.version !== cvVersion || job.version !== jobVersion) return stale;
  const items = validateRequirements(input, cv.evidence.map(({ line }) => line));
  if (!items) return { error: "Review the requirement text and selected evidence." };
  const score = calculateCvFit(items.map(({ required, evidence, partial }) => ({
    required,
    match: evidence ? partial ? "partial" : "demonstrated" : "missing",
  })));
  const saved = db().prepare(`
    INSERT INTO cv_comparisons (preparation_id, cv_version, job_version, items_json, score)
    SELECT p.id, ?, ?, ?, ? FROM preparations p
    WHERE p.id = ? AND p.account_id = ?
      AND ? = (SELECT MAX(version) FROM cv_versions WHERE preparation_id = p.id)
      AND ? = (SELECT MAX(version) FROM target_job_versions WHERE preparation_id = p.id)
    ON CONFLICT (preparation_id, cv_version, job_version)
    DO UPDATE SET items_json = excluded.items_json, score = excluded.score
  `).run(cvVersion, jobVersion, JSON.stringify(items), score, id, account, cvVersion, jobVersion);
  if (!saved.changes) return stale;
  return { report: { items, score } };
}
