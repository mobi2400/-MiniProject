"use server";

import { notFound } from "next/navigation";
import { comparisonConfig, requestComparison } from "../../../../lib/ai-comparison";
import { readCv } from "../../../../lib/cv";
import { calculateCvFit, validateRequirements } from "../../../../lib/cv-fit";
import { run } from "../../../../lib/db";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";

export async function suggestComparison(id: string, cvVersion: number, jobVersion: number) {
  const account = await requireAccount();
  const job = await readTargetJob(account, id);
  if (!job) notFound();
  const cv = await readCv(account, id);
  const stale = { error: "The CV or job changed. Reload the page to compare the latest versions." };
  if (cv?.version !== cvVersion || job.version !== jobVersion) return stale;
  const config = comparisonConfig();
  if (!config) return { error: "AI comparison is unavailable. You can still compare the CV manually." };
  try {
    const items = await requestComparison(config, job.description, cv.evidence);
    const latestCv = await readCv(account, id);
    const latestJob = await readTargetJob(account, id);
    if (latestCv?.version !== cvVersion || latestJob?.version !== jobVersion) return stale;
    return { items };
  } catch {
    return { error: "AI comparison could not be generated. Try again or compare the CV manually." };
  }
}

export async function saveComparison(
  id: string,
  cvVersion: number,
  jobVersion: number,
  input: unknown,
) {
  const account = await requireAccount();
  const job = await readTargetJob(account, id);
  if (!job) notFound();
  const cv = await readCv(account, id);
  const stale = { error: "The CV or job changed. Reload the page to compare the latest versions." };
  if (cv?.version !== cvVersion || job.version !== jobVersion) return stale;
  const items = validateRequirements(input, cv.evidence.map(({ line }) => line));
  if (!items) return { error: "Review the requirement text and selected evidence." };
  const score = calculateCvFit(items.map(({ required, evidence, partial }) => ({
    required,
    match: evidence ? partial ? "partial" : "demonstrated" : "missing",
  })));
  const saved = await run(
    `
    INSERT INTO cv_comparisons (preparation_id, cv_version, job_version, items_json, score)
    SELECT p.id, $1, $2, $3, $4 FROM preparations p
    WHERE p.id = $5 AND p.account_id = $6
      AND $7 = (SELECT MAX(version) FROM cv_versions WHERE preparation_id = p.id)
      AND $8 = (SELECT MAX(version) FROM target_job_versions WHERE preparation_id = p.id)
    ON CONFLICT (preparation_id, cv_version, job_version)
    DO UPDATE SET items_json = excluded.items_json, score = excluded.score
    `,
    [cvVersion, jobVersion, JSON.stringify(items), score, id, account, cvVersion, jobVersion],
  );
  if (!saved) return stale;
  return { report: { items, score } };
}
