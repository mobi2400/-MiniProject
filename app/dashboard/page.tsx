import Link from "next/link";
import { readCv } from "../../lib/cv";
import { db } from "../../lib/db";
import { requireAccount } from "../../lib/session";
import { hasReadiness, readDiagnostic, readReassessments, readTrainingRequirements } from "../../lib/training";
import { hasCoverage } from "../../lib/training-bank";
import { signOut } from "../account/actions";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const accountId = await requireAccount();
  const profile = db().prepare("SELECT 1 FROM profiles WHERE account_id = ?").get(accountId);
  const preparations = db().prepare(`
    SELECT p.id, j.title, j.version
    FROM preparations p JOIN target_job_versions j ON j.preparation_id = p.id
    WHERE p.account_id = ? AND j.version = (
      SELECT MAX(version) FROM target_job_versions WHERE preparation_id = p.id
    )
    ORDER BY p.created_at DESC, p.id
  `).all(accountId) as { id: string; title: string; version: number }[];
  const selectedId = (await searchParams).role;
  const role = preparations.find(({ id }) => id === selectedId) ?? preparations[0];

  function renderProgress() {
    if (!role) return null;
    const base = `/preparations/${role.id}`;
    const cv = readCv(accountId, role.id);
    const comparison = cv && db().prepare(`
      SELECT score FROM cv_comparisons WHERE preparation_id = ? AND cv_version = ? AND job_version = ?
    `).get(role.id, cv.version, role.version) as { score: number } | undefined;
    const diagnostic = readDiagnostic(accountId, role.id, role.version);
    const attempts = readReassessments(accountId, role.id, role.version);
    const latest = attempts.at(-1);
    const scored = attempts.findLast(({ score }) => score !== null);
    const required = readTrainingRequirements(accountId, role.id, role.version);
    const covered = required.length > 0 && required.every(({ title }) => hasCoverage(title));
    const ready = covered && hasReadiness(attempts);
    let action = { label: "Upload your CV", path: "setup" };
    if (latest?.score === null) action = { label: "Resume reassessment", path: "reassessment" };
    else if (diagnostic?.submittedAt === null) action = { label: "Resume diagnostic", path: "diagnostic" };
    else if (ready) action = { label: "Review revised CV", path: "revised-cv" };
    else if (cv && !comparison) action = { label: "Compare your CV", path: "analysis" };
    else if (comparison && (!covered || !diagnostic)) action = { label: "View role coverage", path: "offer" };
    else if (diagnostic?.submittedAt && latest) action = { label: "Review reassessment", path: "reassessment" };
    else if (diagnostic?.submittedAt) action = { label: "Review diagnostic and practice", path: "diagnostic" };

    return (
      <section className="role-progress" aria-labelledby="selected-role">
        <h2 id="selected-role">{role.title}</h2>
        <p>{ready ? "Readiness criteria met" : "Preparation in progress"}</p>
        <Link className="button" href={`${base}/${action.path}`}>{action.label}</Link>
        <dl className="dashboard-scores">
          <div><dt>CV-fit estimate</dt><dd>{comparison ? `${comparison.score}%` : "Comparison pending"}</dd></div>
          <div><dt>SQL joins assessment</dt><dd>{scored ? `${scored.score}% · Reassessment` :
            diagnostic?.score != null ? `${diagnostic.score}% · Diagnostic` : "Untested"}</dd></div>
        </dl>
        <nav className="header-links" aria-label="Selected preparation">
          <Link href={`${base}/setup`}>Preparation setup</Link>
          {diagnostic?.submittedAt && <Link href={`${base}/diagnostic`}>Diagnostic feedback</Link>}
          {latest && latest.score !== null && <Link href={`${base}/reassessment`}>Reassessment feedback</Link>}
        </nav>
      </section>
    );
  }

  return (
    <main className="shell form-page dashboard">
      <Link href="/">MiniProject</Link>
      <h1>Your preparations</h1>
      <p><Link href="/jobs">Job search</Link></p>
      {profile ? <Link className="button" href="/preparations/new">Add a target job</Link> : <Link href="/profile">Complete your profile</Link>}
      {preparations.length ? (
        <nav aria-label="Select a role">
          <ul>{preparations.map(({ id, title }) => (
            <li key={id}><Link href={`/dashboard?role=${encodeURIComponent(id)}`} aria-current={role?.id === id ? "page" : undefined}>{title}</Link></li>
          ))}</ul>
        </nav>
      ) : <p>Your saved jobs will appear here.</p>}
      {renderProgress()}
      <form action={signOut}><button className="text-button">Sign out</button></form>
    </main>
  );
}
