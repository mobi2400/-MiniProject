import Link from "next/link";
import { notFound } from "next/navigation";
import { readCv } from "../../../../lib/cv";
import { readListingSnapshot, readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { CvForm } from "./cv-form";
import { EvidenceForm } from "./evidence-form";
import { ListingStatus } from "./listing-status";

export default async function PreparationSetup({ params }: { params: Promise<{ id: string }> }) {
  const accountId = await requireAccount();
  const { id } = await params;
  const job = await readTargetJob(accountId, id);
  if (!job) notFound();
  const cv = await readCv(accountId, id);
  const listing = await readListingSnapshot(accountId, id);
  return (
    <main className="shell form-page">
      <Link href="/dashboard">Your preparations</Link>
      <h1>{job.title}</h1>
      {listing && <p>{listing.company} · {listing.location} · <a href={listing.url}>Original posting</a></p>}
      {listing && <ListingStatus id={id} status={listing.status} />}
      <h2>Saved job description</h2>
      <p className="saved-description">{job.description}</p>
      <p><Link href={`/preparations/${id}/delete`}>Delete preparation</Link></p>
      <h2>CV evidence</h2>
      <CvForm preparationId={id} />
      {cv && (
        <section aria-label="Extracted CV evidence">
          <Link className="button" href={`/preparations/${id}/analysis`}>Compare CV with this job</Link>
          <p role="status">Saved {cv.filename}, version {cv.version}.</p>
          <p><a href={`/preparations/${id}/cv-download?version=${cv.version}`}>Download original CV</a></p>
          <ul>{cv.evidence.map(({ section, excerpt, line }) => (
            <li key={line}>
              <strong>{section}</strong> · Line {line}
              <p className="saved-description">{excerpt}</p>
              <EvidenceForm key={cv.version} preparationId={id} version={cv.version} line={line} section={section} />
            </li>
          ))}</ul>
        </section>
      )}
    </main>
  );
}
