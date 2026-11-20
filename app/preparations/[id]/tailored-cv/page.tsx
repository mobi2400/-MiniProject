import Link from "next/link";
import { notFound } from "next/navigation";
import { readCv } from "../../../../lib/cv";
import { readKeywordConfirmations } from "../../../../lib/keyword-confirmations";
import { readListingSnapshot, readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { buildTailoredEdits, readTailoredDraft } from "../../../../lib/tailored-cv";
import { generateTailoredDraft } from "./actions";

export default async function TailoredCv({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ changed?: string }>;
}) {
  const account = await requireAccount();
  const { id } = await params;
  const base = `/preparations/${id}`;
  const job = readTargetJob(account, id);
  const listing = readListingSnapshot(account, id);
  if (!job || !listing) notFound();
  const cv = readCv(account, id);
  const draft = readTailoredDraft(account, id);
  const currentEdits = cv && buildTailoredEdits(job.description, cv.evidence, readKeywordConfirmations(account, id, job.version));
  const current = draft && draft.cvVersion === cv?.version && draft.jobVersion === job.version &&
    JSON.stringify(draft.edits) === JSON.stringify(currentEdits);
  const failed = (await searchParams).changed === "1";
  return (
    <main className="shell form-page">
      <Link href={`${base}/analysis`}>Back to CV comparison</Link>
      <h1>Tailored CV draft</h1>
      <p>{job.title} · {listing.company}</p>
      {listing.status === "closed" && <p>Posting closed. Your saved preparation is still available.</p>}
      {failed && <p role="alert">The preparation changed during generation. Try again.</p>}
      {cv ? (
        <>
          <a href={`${base}/cv-download?version=${cv.version}`}>Download original CV</a>
          <form className="fields" action={generateTailoredDraft.bind(null, id)}>
            <button className="button">{draft ? "Regenerate tailored draft" : "Generate tailored draft"}</button>
          </form>
          {draft && !current && <p role="status">Your CV or skill confirmations changed. Regenerate the draft to review current evidence.</p>}
          {current && (
            <section aria-labelledby="draft-edits">
              <h2 id="draft-edits">Suggested changes</h2>
              {draft.edits.length ? <ol>{draft.edits.map((edit) => (
                <li key={edit.source.type === "cv" ? `line-${edit.source.line}` : `term-${edit.source.term}`}>
                  <p><strong>Listing keywords</strong> {edit.terms.join(", ")}</p>
                  <p><strong>Before</strong> {edit.source.type === "cv" ? "This evidence appears in the original CV." : "No matching skill evidence appears in the original CV."}</p>
                  <p className="saved-description"><strong>Proposed addition to Relevant highlights</strong><br />{edit.source.type === "confirmation" ? `${edit.source.term} · ` : ""}{edit.text}</p>
                  <p><strong>Source</strong> {edit.source.type === "cv" ? `${edit.section} · CV line ${edit.source.line}` : `Your confirmation for ${edit.source.term}`}</p>
                </li>
              ))}</ol> : <p>No CV lines or confirmed skills match the recognized listing keywords.</p>}
            </section>
          )}
        </>
      ) : <p><Link href={`${base}/setup`}>Upload your CV</Link> to generate a draft.</p>}
    </main>
  );
}
