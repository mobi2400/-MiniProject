import Link from "next/link";
import { notFound } from "next/navigation";
import { readCvRevision } from "../../../../lib/cv-revision";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";

export default async function RevisedCv({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const job = readTargetJob(account, id);
  if (!job) notFound();
  const revision = readCvRevision(account, id);
  return (
    <main className="shell form-page">
      <Link href={`/preparations/${id}/reassessment`}>Back to readiness</Link>
      <h1>Review your revised CV</h1>
      <p>{job.title}</p>
      {revision ? (
        <>
          <p>Select the existing CV lines you want to highlight for this role. The download keeps the original CV text and adds only the selected lines.</p>
          <a href={`/preparations/${id}/cv-download?version=${revision.cv.version}`}>Download original CV</a>
          <form className="fields" action={`/preparations/${id}/cv-download`} method="get">
            <input type="hidden" name="version" value={revision.cv.version} />
            <input type="hidden" name="mode" value="revised" />
            {revision.edits.map((edit) => (
              <label key={edit.line} className="check-label">
                <input type="checkbox" name="line" value={edit.line} />
                <span>Highlight {edit.section}, line {edit.line}. <strong>{edit.excerpt}</strong> Supports {edit.requirements.join(", ")}.</span>
              </label>
            ))}
            {revision.edits.length ? <button className="button">Download revised CV</button> :
              <p>Link supporting CV lines in your <Link href={`/preparations/${id}/analysis`}>comparison</Link> to review highlights.</p>}
          </form>
        </>
      ) : <p>Complete the readiness criteria and save a current comparison for a covered role to review your revised CV.</p>}
    </main>
  );
}
