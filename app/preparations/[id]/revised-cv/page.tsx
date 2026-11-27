import Link from "next/link";
import { notFound } from "next/navigation";
import { readCvRevision } from "../../../../lib/cv-revision";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { getStage } from "../../../../lib/journey";
import { JourneyBar } from "../../../../components/JourneyBar";
import { copy } from "../../../../lib/copy";

export default async function RevisedCv({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const job = await readTargetJob(account, id);
  if (!job) notFound();
  const revision = await readCvRevision(account, id);
  const stage = await getStage(account, id);

  return (
    <main className="shell form-page">
      <Link href={`/preparations/${id}/reassessment`}>Back to skill checks</Link>

      <JourneyBar currentStep={stage.step} preparationId={id} />

      <h1>{copy.revisedCvHeading}</h1>
      <p style={{ color: "var(--muted)" }}>{job.title}</p>
      
      {revision ? (
        <>
          <p style={{ marginBlock: "1rem" }}>{copy.revisedCvIntro}</p>
          <p><a href={`/preparations/${id}/cv-download?version=${revision.cv.version}`}>Download original CV</a></p>
          <form className="fields" action={`/preparations/${id}/cv-download`} method="get">
            <input type="hidden" name="version" value={revision.cv.version} />
            <input type="hidden" name="mode" value="revised" />
            {revision.edits.map((edit) => (
              <label key={edit.line} className="check-label" style={{ border: "1px solid var(--line)", padding: "0.75rem", borderRadius: "0.5rem" }}>
                <input type="checkbox" name="line" value={edit.line} defaultChecked />
                <span>Highlight {edit.section}, line {edit.line}. <strong>{edit.excerpt}</strong> Supports {edit.requirements.join(", ")}.</span>
              </label>
            ))}
            {revision.edits.length ? <button className="button" style={{ marginTop: "1rem" }}>Download revised CV</button> :
              <p>Link supporting CV lines in your <Link href={`/preparations/${id}/analysis`}>comparison</Link> to review highlights.</p>}
          </form>
        </>
      ) : (
        <div style={{ marginBlock: "1.5rem", padding: "1rem", background: "#fdf8f8", border: "1px solid #eccbcb", borderRadius: "0.5rem" }}>
          <p style={{ margin: 0, color: "#a32a2a" }}>
            To unlock your revised CV, you need two consecutive skill check scores of 75% or higher on SQL joins.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            <Link className="button" href={`/preparations/${id}/reassessment`}>Go to skill checks</Link>
          </p>
        </div>
      )}

      <div className="page-navigation-actions">
        {stage.backAction ? (
          <Link href={stage.backAction.href} className="text-button">
            ← {stage.backAction.label}
          </Link>
        ) : <div />}
        <Link href="/dashboard" className="button button-secondary">
          Back to all preparations
        </Link>
      </div>
    </main>
  );
}
