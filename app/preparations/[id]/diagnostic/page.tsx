import Link from "next/link";
import { notFound } from "next/navigation";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { readDiagnostic } from "../../../../lib/training";
import { submitDiagnostic } from "./actions";
import { JoinPractice } from "./practice";
import { copy } from "../../../../lib/copy";

export default async function Diagnostic({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ answer?: string }>;
}) {
  const account = await requireAccount();
  const { id } = await params;
  const job = await readTargetJob(account, id);
  const attempt = job && (await readDiagnostic(account, id, job.version));
  if (!job || !attempt) notFound();
  const question = attempt.question;
  return (
    <main className="shell form-page">
      <Link href={`/preparations/${id}/offer`}>Back to role coverage</Link>
      <h1>SQL joins skill check</h1>
      <p>{job.title}</p>
      {attempt.submittedAt !== null ? (
        <section aria-labelledby="diagnostic-feedback">
          <h2 id="diagnostic-feedback">{copy.diagnosticFeedback}</h2>
          <p>Score: {attempt.score}%</p>
          <p>Your answer: {attempt.selected === null ? "" : question.options[attempt.selected]}</p>
          <p>Correct answer: {question.options[question.answer]}</p>
          <p>{question.feedback}</p>
          <p>Use this result to identify what to practice. Readiness requires independent skill checks.</p>
          {attempt.score === 0 && <JoinPractice />}
          <Link className="button" href={`/preparations/${id}/reassessment`}>Go to skill check</Link>
        </section>
      ) : (
        <form className="fields" action={submitDiagnostic.bind(null, id, job.version)}>
          <fieldset className="fields">
            <legend>{question.prompt}</legend>
            {question.options.map((option, index) => (
              <label className="check-label" key={option}>
                <input type="radio" name="answer" value={index} required /> {option}
              </label>
            ))}
          </fieldset>
          {(await searchParams).answer === "required" && <p role="alert">Choose an answer before submitting.</p>}
          <button className="button">Submit skill check</button>
        </form>
      )}
    </main>
  );
}
