import Link from "next/link";
import { notFound } from "next/navigation";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";

export default async function PreparationSetup({ params }: { params: Promise<{ id: string }> }) {
  const accountId = await requireAccount();
  const { id } = await params;
  const job = readTargetJob(accountId, id);
  if (!job) notFound();
  return (
    <main className="shell form-page">
      <Link href="/dashboard">Your preparations</Link>
      <h1>{job.title}</h1>
      <h2>Saved job description</h2>
      <p className="saved-description">{job.description}</p>
    </main>
  );
}
