import Link from "next/link";
import { notFound } from "next/navigation";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { readDiagnostic, readTrainingRequirements } from "../../../../lib/training";
import { hasCoverage, qualifyingAttempts, readinessThreshold } from "../../../../lib/training-bank";
import { startDiagnostic } from "../diagnostic/actions";
import { getStage } from "../../../../lib/journey";
import { JourneyBar } from "../../../../components/JourneyBar";
import { copy } from "../../../../lib/copy";
import { skillLabel } from "../../../../lib/skill-label";

export default async function Offer({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const job = await readTargetJob(account, id);
  if (!job) notFound();
  const required = await readTrainingRequirements(account, id, job.version);
  const diagnostic = await readDiagnostic(account, id, job.version);
  const unsupported = required.some(({ title }) => !hasCoverage(title));
  const stage = await getStage(account, id);

  return (
    <main className="shell form-page" id="main-content">
      <JourneyBar currentStep={stage.step} preparationId={id} />

      <header className="page-title-block">
        <h1>{copy.roleCoverage}</h1>
        <p className="list-row-meta">{job.title}</p>
      </header>

      {required.length ? (
        <>
          <section className="card" aria-labelledby="skills-heading">
            <h2 id="skills-heading" className="card-title">Skills this job asks for</h2>
            <ul className="list">
              {required.map((item) => {
                const covered = hasCoverage(item.title);
                return (
                  <li key={item.id} className="list-row">
                    <div className="list-row-main">
                      <strong>{skillLabel(item.title)}</strong>
                      <div className="list-row-meta">{item.title}</div>
                    </div>
                    {covered ? (
                      <span className="badge badge-ok">Practice available</span>
                    ) : (
                      <span className="badge badge-warn">No practice yet</span>
                    )}
                  </li>
                );
              })}
            </ul>
            {unsupported && <p className="list-row-meta">{copy.someSkillsNoPractice}</p>}
          </section>

          {!unsupported && (
            <section className="card" aria-labelledby="terms-heading">
              <h2 id="terms-heading" className="card-title">{copy.practiceHowItWorks}</h2>
              <p>The pilot plan includes a starting skill check, guided practice, and skill checks for the skills above.</p>
              <p>
                The revised CV becomes available after {qualifyingAttempts} consecutive skill checks achieve at least{" "}
                {readinessThreshold}% overall and in each required skill.
              </p>
              <p><strong>{copy.practiceFreeDuringPilot}</strong></p>
              <div className="cluster">
                {diagnostic ? (
                  <Link className="button" href={`/preparations/${id}/diagnostic`}>
                    {diagnostic.submittedAt ? "View skill check feedback" : copy.resumeDiagnostic}
                  </Link>
                ) : (
                  <form className="fields" action={startDiagnostic.bind(null, id)}>
                    <button className="button">{copy.startDiagnostic}</button>
                  </form>
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="empty-state">
          <p>{copy.compareFirstPrompt}</p>
          <Link className="button" href={`/preparations/${id}/analysis`}>Compare my CV</Link>
        </div>
      )}

      <div className="page-navigation-actions">
        {stage.backAction ? (
          <Link href={stage.backAction.href} className="text-button">
            ← {stage.backAction.label}
          </Link>
        ) : <div />}
        {diagnostic?.submittedAt && (
          <Link href={stage.nextAction.href} className="button">
            {stage.nextAction.label} →
          </Link>
        )}
      </div>
    </main>
  );
}
