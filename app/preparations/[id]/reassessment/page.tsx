import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { hasReadiness, readDiagnostic, readReassessments } from "../../../../lib/training";
import { sqlJoinQuestions } from "../../../../lib/training-bank";
import { startReassessment, submitReassessment } from "./actions";

export default async function Reassessment({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const job = readTargetJob(account, id);
  if (!job) notFound();
  if (!readDiagnostic(account, id, job.version)?.submittedAt) redirect(`/preparations/${id}/offer`);
  const attempts = readReassessments(account, id, job.version);
  const latest = attempts.at(-1);
  const ready = hasReadiness(attempts);
  return (
    <main className="shell form-page">
      <Link href={`/preparations/${id}/diagnostic`}>Back to diagnostic and practice</Link>
      <h1>SQL joins reassessment</h1>
      <p>{job.title}</p>
      {latest && latest.score === null ? (
        <form className="fields" action={submitReassessment.bind(null, id, job.version, latest.sequence)}>
          <fieldset className="fields">
            <legend>{latest.question.prompt}</legend>
            {latest.question.options.map((option, index) => (
              <label className="check-label" key={option}><input type="radio" name="answer" value={index} required /> {option}</label>
            ))}
          </fieldset>
          <button className="button">Submit reassessment</button>
        </form>
      ) : (
        <>
          {latest && <section aria-label="Reassessment feedback">
            <p>Score: {latest.score}%</p>
            <p>{latest.question.feedback}</p>
          </section>}
          {ready ? <p role="status">Readiness criteria met for SQL joins.</p> :
            attempts.length >= sqlJoinQuestions.length - 1 ? <p>Fresh questions are unavailable for this role. Your saved results remain accessible.</p> :
              <form className="fields" action={startReassessment.bind(null, id, attempts.length)}>
                <button className="button">{latest ? "Start another reassessment" : "Start reassessment"}</button>
              </form>}
        </>
      )}
    </main>
  );
}
