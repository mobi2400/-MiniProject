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
    <main className="shell form-page">
      <Link href="/dashboard">Your preparations</Link>
      
      <JourneyBar currentStep={stage.step} preparationId={id} />

      <h1>{job.title}</h1>

      <section aria-labelledby="job-details-heading" style={{ marginBlock: "1.5rem" }}>
        <h2 id="job-details-heading">Job details</h2>
        {listing && <p>{listing.company} · {listing.location} · <a href={listing.url} target="_blank" rel="noopener noreferrer">Original posting</a></p>}
        {listing && <ListingStatus id={id} status={listing.status} />}
        <p className="saved-description" style={{ marginBlock: "0.75rem", color: "var(--muted)" }}>{job.description}</p>
      </section>

      <section aria-labelledby="cv-details-heading" style={{ marginBlock: "1.5rem", borderTop: "1px solid var(--line)", paddingTop: "1.5rem" }}>
        <h2 id="cv-details-heading">Your CV</h2>
        <CvForm preparationId={id} />
        {cv && (
          <div style={{ marginBlock: "1rem" }}>
            <p role="status" style={{ fontWeight: 600 }}>{copy.savedCvNote(cv.filename)}</p>
            <p><a href={`/preparations/${id}/cv-download?version=${cv.version}`}>Download original CV</a></p>
            
            <h3 style={{ marginBlock: "1rem 0.5rem" }}>Extracted experience grouped by section</h3>
            <div style={{ display: "grid", gap: "1.25rem" }}>
              {Object.entries(groupedEvidence).map(([sectionName, lines]) => (
                <div key={sectionName} style={{ background: "white", border: "1px solid var(--line)", borderRadius: "0.5rem", padding: "1rem" }}>
                  <h4 style={{ margin: "0 0 0.5rem", color: "var(--indigo)" }}>{sectionName}</h4>
                  <ul style={{ margin: 0, paddingInlineStart: "1.25rem" }}>
                    {lines.map(({ excerpt, line, section }) => (
                      <li key={line} style={{ marginBlock: "0.4rem" }}>
                        <span>Line {line}: {excerpt}</span>
                        <EvidenceForm preparationId={id} version={cv.version} line={line} section={section} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <Link className="button" href={`/preparations/${id}/analysis`}>
                Compare CV with this job
              </Link>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="delete-heading" style={{ marginBlock: "2.5rem 1rem", borderTop: "1px solid var(--line)", paddingTop: "1.5rem" }}>
        <h2 id="delete-heading" style={{ fontSize: "1.25rem", color: "#a32a2a" }}>Delete this preparation</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Need to remove this role? You can permanently delete this preparation, its CV versions, comparisons, and practice results.
        </p>
        <Link href={`/preparations/${id}/delete`} style={{ color: "#a32a2a", fontWeight: 600 }}>
          Delete preparation…
        </Link>
      </section>

      <div className="page-navigation-actions">
        {stage.backAction ? (
          <Link href={stage.backAction.href} className="text-button">
            ← {stage.backAction.label}
          </Link>
        ) : <div />}
        <Link href={stage.nextAction.href} className="button">
          {stage.nextAction.label} →
        </Link>
      </div>
    </main>
  );
}
