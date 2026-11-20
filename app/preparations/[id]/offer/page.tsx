import Link from "next/link";
import { notFound } from "next/navigation";
import { readCv } from "../../../../lib/cv";
import type { Requirement } from "../../../../lib/cv-fit";
import { db } from "../../../../lib/db";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { hasCoverage, qualifyingAttempts, readinessThreshold } from "../../../../lib/training-bank";

export default async function Offer({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const job = readTargetJob(account, id);
  if (!job) notFound();
  const cv = readCv(account, id);
  const comparison = cv && db().prepare(`
    SELECT c.items_json FROM cv_comparisons c JOIN preparations p ON p.id = c.preparation_id
    WHERE p.account_id = ? AND p.id = ? AND c.cv_version = ? AND c.job_version = ?
  `).get(account, id, cv.version, job.version) as { items_json: string } | undefined;
  const items = comparison ? JSON.parse(comparison.items_json) as Requirement[] : [];
  const required = items.filter((item) => item.required);
  const unsupported = required.some(({ title }) => !hasCoverage(title));
  return (
    <main className="shell form-page">
      <Link href={`/preparations/${id}/analysis`}>Back to CV comparison</Link>
      <h1>Role coverage</h1>
      <h2>{job.title}</h2>
      {required.length ? (
        <>
          <ul>{required.map(({ id, title }) => (
            <li key={id}>{title} · {hasCoverage(title) ? "Assessment material available" : "Required skill missing from the question bank"}</li>
          ))}</ul>
          {unsupported ? <p>Paid checkout is unavailable for this role because a required skill lacks coverage.</p> : (
            <section aria-labelledby="preparation-terms">
              <h2 id="preparation-terms">Preparation terms</h2>
              <p>The pilot plan includes a diagnostic, guided practice, and independent reassessments for the skills above.</p>
              <p>The revised CV becomes available after {qualifyingAttempts} consecutive independent reassessments achieve at least {readinessThreshold}% overall and in each required skill.</p>
              <p>This preview is free. Paid checkout is pending.</p>
            </section>
          )}
        </>
      ) : <p>Save a comparison with at least one required skill to see coverage.</p>}
    </main>
  );
}
