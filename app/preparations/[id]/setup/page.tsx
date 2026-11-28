import Link from "next/link";
import { notFound } from "next/navigation";
import { readCv } from "../../../../lib/cv";
import { readListingSnapshot, readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { getStage } from "../../../../lib/journey";
import { copy } from "../../../../lib/copy";
import { JourneyBar } from "../../../../components/JourneyBar";
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
  const stage = await getStage(accountId, id);

  // Group evidence lines by section
  const groupedEvidence = cv
    ? cv.evidence.reduce<Record<string, typeof cv.evidence>>((acc, item) => {
        acc[item.section] = acc[item.section] || [];
        acc[item.section].push(item);
        return acc;
      }, {})
    : {};

  return (
    <main className="shell form-page" id="main-content">
      <Link href="/dashboard">Your preparations</Link>

      <JourneyBar currentStep={stage.step} preparationId={id} />

      <h1>{job.title}</h1>

      <section aria-labelledby="job-details-heading" className="card">
        <h2 className="card-title" id="job-details-heading">Job details</h2>
        {listing && (
          <p>
            {listing.company} · {listing.location} ·{" "}
            <a href={listing.url} target="_blank" rel="noopener noreferrer">
              Original posting
            </a>
          </p>
        )}
        {listing && <ListingStatus id={id} status={listing.status} />}
        <p className="saved-description list-row-meta">{job.description}</p>
      </section>

      <section aria-labelledby="cv-details-heading" className="card">
        <h2 className="card-title" id="cv-details-heading">Your CV</h2>
        <CvForm preparationId={id} />
        {cv && (
          <div className="stack">
            <p role="status">
              <strong>{copy.savedCvNote(cv.filename)}</strong>
            </p>
            <p>
              <a href={`/preparations/${id}/cv-download?version=${cv.version}`}>Download original CV</a>
            </p>

            <h3 className="card-title">Extracted experience grouped by section</h3>
            <div className="stack">
              {Object.entries(groupedEvidence).map(([sectionName, lines]) => (
                <div key={sectionName} className="card">
                  <h4 className="card-title">{sectionName}</h4>
                  <ul className="stack">
                    {lines.map(({ excerpt, line, section }) => (
                      <li key={line}>
                        <span>
                          Line {line}: {excerpt}
                        </span>
                        <EvidenceForm preparationId={id} version={cv.version} line={line} section={section} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div>
              <Link className="button" href={`/preparations/${id}/analysis`}>
                Compare CV with this job
              </Link>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="delete-heading" className="danger-zone">
        <h2 className="card-title" id="delete-heading">Delete this preparation</h2>
        <p className="list-row-meta">
          Need to remove this role? You can permanently delete this preparation, its CV versions, comparisons, and practice results.
        </p>
        <Link href={`/preparations/${id}/delete`}>
          Delete preparation…
        </Link>
      </section>

      <div className="page-navigation-actions">
        {stage.backAction ? (
          <Link href={stage.backAction.href} className="text-button">
            ← {stage.backAction.label}
          </Link>
        ) : (
          <div />
        )}
        <Link href={stage.nextAction.href} className="button">
          {stage.nextAction.label} →
        </Link>
      </div>
    </main>
  );
}