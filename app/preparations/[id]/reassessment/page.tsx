import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { hasReadiness, readDiagnostic, readReassessments } from "../../../../lib/training";
import { sqlJoinQuestions, qualifyingAttempts } from "../../../../lib/training-bank";
import { getStage } from "../../../../lib/journey";
import { JourneyBar } from "../../../../components/JourneyBar";
import { startReassessment, submitReassessment } from "./actions";
import { copy } from "../../../../lib/copy";

export default async function Reassessment({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const job = await readTargetJob(account, id);
  if (!job) notFound();
  const diag = await readDiagnostic(account, id, job.version);
  if (!diag?.submittedAt) redirect(`/preparations/${id}/offer`);
  const attempts = await readReassessments(account, id, job.version);
  const latest = attempts.at(-1);
  const ready = hasReadiness(attempts);
  const stage = await getStage(account, id);

  // Count current consecutive passing scores
  let consecutivePassing = 0;
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i].score !== null && (attempts[i].score ?? 0) >= 75) {
      consecutivePassing++;
    } else {
      break;
    }
  }

  return (
    <main className="shell form-page" id="main-content">
      <Link href={`/preparations/${id}/diagnostic`}>Back to skill check and practice</Link>

      <JourneyBar currentStep={stage.step} preparationId={id} />

      <h1>SQL joins skill check</h1>
      <p style={{ color: "var(--muted)" }}>{job.title}</p>

      <div style={{ marginBlock: "1rem", padding: "0.75rem 1rem", background: "#f8f7fd", borderRadius: "0.5rem" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>
          Correct answers in a row: {Math.min(consecutivePassing, qualifyingAttempts)} of {qualifyingAttempts}
        </p>
      </div>

      {latest && latest.score === null ? (
        <form className="fields" action={submitReassessment.bind(null, id, job.version, latest.sequence)}>
          <p style={{ fontWeight: 600 }}>Question {latest.sequence} of {sqlJoinQuestions.length - 1}</p>
          <fieldset className="fields">
            <legend>{latest.question.prompt}</legend>
            {latest.question.options.map((option, index) => (
              <label className="check-label" key={option}><input type="radio" name="answer" value={index} required /> {option}</label>
            ))}
          </fieldset>
          <button className="button">Submit skill check</button>
        </form>
      ) : (
        <>
          {latest && <section aria-label="Skill check feedback" style={{ marginBlock: "1.25rem", padding: "1rem", border: "1px solid var(--line)", borderRadius: "0.5rem" }}>
            <p style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.5rem" }}>Score: {latest.score}%</p>
            <p style={{ margin: 0 }}>{latest.question.feedback}</p>
          </section>}
          {ready ? <section className="fields">
            <p role="status" style={{ fontWeight: 700, color: "#2b7a3d" }}>{copy.readinessMet}</p>
            <Link className="button" href={`/preparations/${id}/revised-cv`}>Review revised CV</Link>
          </section> :
            attempts.length >= sqlJoinQuestions.length - 1 ? <p>Fresh questions are unavailable for this role. Your saved results remain accessible.</p> :
              <form className="fields" action={startReassessment.bind(null, id, attempts.length)}>
                <button className="button">{latest ? "Start another skill check" : "Start skill check"}</button>
              </form>}
        </>
      )}

      <div className="page-navigation-actions">
        {stage.backAction ? (
          <Link href={stage.backAction.href} className="text-button">
            ← {stage.backAction.label}
          </Link>
        ) : <div />}
        {ready && (
          <Link href={stage.nextAction.href} className="button">
            {stage.nextAction.label} →
          </Link>
        )}
      </div>
    </main>
  );
}
