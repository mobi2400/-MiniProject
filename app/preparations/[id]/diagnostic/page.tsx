import Link from "next/link";
import { notFound } from "next/navigation";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { readDiagnostic } from "../../../../lib/training";
import { getStage } from "../../../../lib/journey";
import { JourneyBar } from "../../../../components/JourneyBar";
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
  const stage = await getStage(account, id);
  const question = attempt.question;

  return (
    <main className="shell form-page" id="main-content">
      <Link href={`/preparations/${id}/offer`}>Back to role coverage</Link>

      <JourneyBar currentStep={stage.step} preparationId={id} />

      <h1>SQL joins starting skill check</h1>
      <p style={{ color: "var(--muted)" }}>{job.title}</p>
      
      {attempt.submittedAt !== null ? (
        <section aria-labelledby="diagnostic-feedback" style={{ marginBlock: "1.5rem" }}>
          <h2 id="diagnostic-feedback">{copy.diagnosticFeedback}</h2>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, marginBlock: "0.5rem" }}>Score: {attempt.score}%</p>
          <p>Your answer: <strong>{attempt.selected === null ? "" : question.options[attempt.selected]}</strong></p>
          <p>Correct answer: <strong>{question.options[question.answer]}</strong></p>
          <p style={{ background: "#f8f7fd", padding: "1rem", borderRadius: "0.5rem" }}>{question.feedback}</p>
          <p>Use this result to identify what to practice. Readiness requires independent skill checks.</p>
          {attempt.score === 0 && <JoinPractice />}
          <div style={{ marginTop: "1.5rem" }}>
            <Link className="button" href={`/preparations/${id}/reassessment`}>See results & go to skill check</Link>
          </div>
        </section>
      ) : (
        <form className="fields" action={submitDiagnostic.bind(null, id, job.version)}>
          <p style={{ fontWeight: 600 }}>Question 1 of 1</p>
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

      <div className="page-navigation-actions">
        {stage.backAction ? (
          <Link href={stage.backAction.href} className="text-button">
            ← {stage.backAction.label}
          </Link>
        ) : <div />}
        {attempt.submittedAt !== null && (
          <Link href={stage.nextAction.href} className="button">
            {stage.nextAction.label} →
          </Link>
        )}
      </div>
    </main>
  );
}
