import Link from "next/link";
import { notFound } from "next/navigation";
import { readCv } from "../../../../lib/cv";
import { comparisonConfig } from "../../../../lib/ai-comparison";
import type { Requirement } from "../../../../lib/cv-fit";
import { db } from "../../../../lib/db";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { CompareForm } from "./compare-form";
import { saveComparison, suggestComparison } from "./actions";

export default async function Analysis({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const job = readTargetJob(account, id);
  if (!job) notFound();
  const cv = readCv(account, id);
  const stored = cv && db().prepare(`
    SELECT c.items_json, c.score FROM cv_comparisons c
    JOIN preparations p ON p.id = c.preparation_id
    WHERE p.account_id = ? AND p.id = ? AND c.cv_version = ? AND c.job_version = ?
  `).get(account, id, cv.version, job.version) as { items_json: string; score: number } | undefined;
  const report = stored && { items: JSON.parse(stored.items_json) as Requirement[], score: stored.score };
  return (
    <main className="shell form-page">
      <Link href={`/preparations/${id}/setup`}>Back to preparation</Link>
      <h1>CV comparison</h1>
      <h2>{job.title}</h2>
      <p className="saved-description">{job.description}</p>
      {cv ? (
        <>
          <p>Comparing CV version {cv.version} with job version {job.version}.</p>
          <p><Link href={`/preparations/${id}/offer`}>Preview role coverage</Link></p>
          <CompareForm key={`${id}:${job.version}:${cv.version}`} evidence={cv.evidence}
            report={report} save={saveComparison.bind(null, id, cv.version, job.version)}
            suggest={comparisonConfig() ? suggestComparison.bind(null, id, cv.version, job.version) : undefined} />
        </>
      ) : <p>Upload a CV in preparation setup to compare it with this job.</p>}
    </main>
  );
}
