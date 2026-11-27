import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { hasReadiness, readDiagnostic, readReassessments } from "../../../../lib/training";
import { sqlJoinQuestions } from "../../../../lib/training-bank";
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
  return (
    <main className="shell form-page">
      <Link href={`/preparations/${id}/diagnostic`}>Back to skill check and practice</Link>
      <h1>SQL joins skill check</h1>
      <p>{job.title}</p>
      {latest && latest.score === null ? (
        <form className="fields" action={submitReassessment.bind(null, id, job.version, latest.sequence)}>
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
          {latest && <section aria-label="Skill check feedback">
            <p>Score: {latest.score}%</p>
            <p>{latest.question.feedback}</p>
          </section>}
          {ready ? <section className="fields">
            <p role="status">{copy.readinessMet}</p>
            <Link className="button" href={`/preparations/${id}/revised-cv`}>Review revised CV</Link>
          </section> :
            attempts.length >= sqlJoinQuestions.length - 1 ? <p>Fresh questions are unavailable for this role. Your saved results remain accessible.</p> :
              <form className="fields" action={startReassessment.bind(null, id, attempts.length)}>
                <button className="button">{latest ? "Start another skill check" : "Start skill check"}</button>
              </form>}
        </>
      )}
    </main>
  );
}
