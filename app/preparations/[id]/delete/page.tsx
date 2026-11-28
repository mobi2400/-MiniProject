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
  const job = await readTargetJob(account, id);
  if (!job) notFound();
  return (
    <main className="shell form-page" id="main-content">
      <Link href={`/preparations/${id}/setup`}>Back to preparation</Link>
      <h1>Delete preparation</h1>
      <h2>{job.title}</h2>
      <p style={{ marginBlock: "0.75rem" }}>
        Deleting this preparation permanently removes:
      </p>
      <ul style={{ color: "var(--muted)", marginBlock: "0.5rem 1rem" }}>
        <li>Job description and title</li>
        <li>All uploaded CV versions and extracted experience</li>
        <li>CV comparison reports and keyword confirmations</li>
        <li>Practice results and skill check history</li>
        <li>Generated tailored CV drafts and revised CVs</li>
      </ul>
      <p>This action is permanent and cannot be undone. Your account and other preparations remain untouched.</p>
      <form className="fields" action={confirmDeletion.bind(null, id)}>
        <label className="check-label"><input required type="checkbox" name="confirm" value="yes" /> I confirm that I want to delete this preparation</label>
        {(await searchParams).confirm === "required" && <p role="alert">Confirm deletion before continuing.</p>}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button className="button" style={{ background: "#a32a2a" }}>Delete this preparation</button>
          <Link href={`/preparations/${id}/setup`} className="text-button">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
