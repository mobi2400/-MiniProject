import Link from "next/link";
import { notFound } from "next/navigation";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { confirmDeletion } from "./actions";

export default async function DeletePreparation({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirm?: string }>;
}) {
  const account = await requireAccount();
  const { id } = await params;
  const job = readTargetJob(account, id);
  if (!job) notFound();
  return (
    <main className="shell form-page">
      <Link href={`/preparations/${id}/setup`}>Back to preparation</Link>
      <h1>Delete preparation</h1>
      <h2>{job.title}</h2>
      <p>Deleting this preparation removes its job description, uploaded CV versions, comparisons, and training answers and results from the app. Saved download links stop working immediately. Copies you already downloaded stay on your device.</p>
      <p>This action is permanent. Your account and other preparations remain available.</p>
      <form className="fields" action={confirmDeletion.bind(null, id)}>
        <label className="check-label"><input required type="checkbox" name="confirm" value="yes" /> I want to delete this preparation</label>
        {(await searchParams).confirm === "required" && <p role="alert">Confirm deletion before continuing.</p>}
        <button className="button">Delete this preparation</button>
      </form>
    </main>
  );
}
