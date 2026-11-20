import Link from "next/link";
import { notFound } from "next/navigation";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { readDiagnostic, readTrainingRequirements } from "../../../../lib/training";
import { hasCoverage, qualifyingAttempts, readinessThreshold } from "../../../../lib/training-bank";
import { startDiagnostic } from "../diagnostic/actions";

export default async function Offer({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const job = readTargetJob(account, id);
  if (!job) notFound();
  const required = readTrainingRequirements(account, id, job.version);
  const diagnostic = readDiagnostic(account, id, job.version);
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
              {diagnostic ? (
                <Link href={`/preparations/${id}/diagnostic`}>{diagnostic.submittedAt ? "View diagnostic feedback" : "Resume diagnostic"}</Link>
              ) : (
                <form className="fields" action={startDiagnostic.bind(null, id)}>
                  <button className="button">Start free diagnostic</button>
                </form>
              )}
            </section>
          )}
        </>
      ) : <p>Save a comparison with at least one required skill to see coverage.</p>}
    </main>
  );
}
