import Link from "next/link";
import { notFound } from "next/navigation";
import { readCv } from "../../../../lib/cv";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { CompareForm } from "./compare-form";

export default async function Analysis({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const job = readTargetJob(account, id);
  if (!job) notFound();
  const cv = readCv(account, id);
  return (
    <main className="shell form-page">
      <Link href={`/preparations/${id}/setup`}>Back to preparation</Link>
      <h1>CV comparison</h1>
      <h2>{job.title}</h2>
      <p className="saved-description">{job.description}</p>
      {cv ? (
        <>
          <p>Comparing CV version {cv.version} with job version {job.version}.</p>
          <CompareForm key={`${id}:${job.version}:${cv.version}`} evidence={cv.evidence} />
        </>
      ) : <p>Upload a CV in preparation setup to compare it with this job.</p>}
    </main>
  );
}
