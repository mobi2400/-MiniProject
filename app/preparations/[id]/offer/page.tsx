import Link from "next/link";
import { notFound } from "next/navigation";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { readDiagnostic, readTrainingRequirements } from "../../../../lib/training";
import { hasCoverage, qualifyingAttempts, readinessThreshold } from "../../../../lib/training-bank";
import { startDiagnostic } from "../diagnostic/actions";
import { copy } from "../../../../lib/copy";

export default async function Offer({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const job = await readTargetJob(account, id);
  if (!job) notFound();
  const required = await readTrainingRequirements(account, id, job.version);
  const diagnostic = await readDiagnostic(account, id, job.version);
  const unsupported = required.some(({ title }) => !hasCoverage(title));
  return (
    <main className="shell form-page">
      <Link href={`/preparations/${id}/analysis`}>Back to CV comparison</Link>
      <h1>{copy.roleCoverage}</h1>
      <h2>{job.title}</h2>
      {required.length ? (
        <>
          <ul>{required.map(({ id, title }) => (
            <li key={id}>{title} · {hasCoverage(title) ? "Assessment material available" : copy.missingSkillPractice(title)}</li>
          ))}</ul>
          {unsupported ? <p>Some required skills do not have practice available yet. You can still use the other steps.</p> : (
            <section aria-labelledby="preparation-terms">
              <h2 id="preparation-terms">Preparation terms</h2>
              <p>The pilot plan includes a starting skill check, guided practice, and skill checks for the skills above.</p>
              <p>The revised CV becomes available after {qualifyingAttempts} consecutive skill checks achieve at least {readinessThreshold}% overall and in each required skill.</p>
              <p>{copy.practiceFreeDuringPilot}</p>
              {diagnostic ? (
                <Link href={`/preparations/${id}/diagnostic`}>{diagnostic.submittedAt ? "View skill check feedback" : copy.resumeDiagnostic}</Link>
              ) : (
                <form className="fields" action={startDiagnostic.bind(null, id)}>
                  <button className="button">{copy.startDiagnostic}</button>
                </form>
              )}
            </section>
          )}
        </>
      ) : <p>{copy.compareFirstPrompt}</p>}
    </main>
  );
}
