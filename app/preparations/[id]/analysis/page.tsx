import Link from "next/link";
import { notFound } from "next/navigation";
import { readCv } from "../../../../lib/cv";
import { comparisonConfig } from "../../../../lib/ai-comparison";
import type { Requirement } from "../../../../lib/cv-fit";
import { one } from "../../../../lib/db";
import { readListingSnapshot, readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { getStage } from "../../../../lib/journey";
import { JourneyBar } from "../../../../components/JourneyBar";
import { CompareForm } from "./compare-form";
import { saveComparison, suggestComparison } from "./actions";
import { KeywordCoverage } from "./keyword-coverage";

export default async function Analysis({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const job = await readTargetJob(account, id);
  if (!job) notFound();
  const cv = await readCv(account, id);
  const listing = await readListingSnapshot(account, id);
  const stage = await getStage(account, id);

  const stored =
    cv &&
    (await one<{ items_json: string; score: number }>(
      `
    SELECT c.items_json, c.score FROM cv_comparisons c
    JOIN preparations p ON p.id = c.preparation_id
    WHERE p.account_id = $1 AND p.id = $2 AND c.cv_version = $3 AND c.job_version = $4
    `,
      [account, id, cv.version, job.version],
    ));
  const report = stored && { items: JSON.parse(stored.items_json) as Requirement[], score: stored.score };

  return (
    <main className="shell form-page" id="main-content">
      <Link href={`/preparations/${id}/setup`}>Back to preparation</Link>

      <JourneyBar currentStep={stage.step} preparationId={id} />

      <h1>CV match</h1>
      <h2>{job.title}</h2>
      <p className="saved-description" style={{ color: "var(--muted)", marginBlock: "0.5rem 1rem" }}>{job.description}</p>
      
      {cv ? (
        <>
          <p style={{ fontSize: "0.95rem", color: "var(--muted)" }}>Comparing CV ({cv.filename}) with job requirements.</p>
          
          {report && (
            <p><Link href={`/preparations/${id}/offer`} className="button button-secondary">View practice available</Link></p>
          )}

          {listing && <KeywordCoverage account={account} id={id} jobVersion={job.version} cvVersion={cv.version}
            description={job.description} evidence={cv.evidence} />}
          {listing && <p><Link href={`/preparations/${id}/tailored-cv`}>Tailor CV for this listing</Link></p>}

          <CompareForm key={`${id}:${job.version}:${cv.version}`} evidence={cv.evidence}
            report={report} save={saveComparison.bind(null, id, cv.version, job.version)}
            suggest={comparisonConfig() ? suggestComparison.bind(null, id, cv.version, job.version) : undefined} />
        </>
      ) : <p>Upload a CV in preparation setup to compare it with this job.</p>}

      <div className="page-navigation-actions">
        {stage.backAction ? (
          <Link href={stage.backAction.href} className="text-button">
            ← {stage.backAction.label}
          </Link>
        ) : <div />}
        {report && (
          <Link href={stage.nextAction.href} className="button">
            {stage.nextAction.label} →
          </Link>
        )}
      </div>
    </main>
  );
}
