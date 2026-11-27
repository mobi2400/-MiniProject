import Link from "next/link";
import { readCv } from "../../lib/cv";
import { many, one } from "../../lib/db";
import { requireAccount } from "../../lib/session";
import { hasReadiness, readDiagnostic, readReassessments, readTrainingRequirements } from "../../lib/training";
import { hasCoverage } from "../../lib/training-bank";
import { signOut } from "../account/actions";

import { copy } from "../../lib/copy";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const accountId = await requireAccount();
  const profile = await one("SELECT 1 FROM profiles WHERE account_id = $1", [accountId]);
  const preparations = await many<{ id: string; title: string; version: number }>(
    `
    SELECT p.id, j.title, j.version
    FROM preparations p JOIN target_job_versions j ON j.preparation_id = p.id
    WHERE p.account_id = $1 AND j.version = (
      SELECT MAX(version) FROM target_job_versions WHERE preparation_id = p.id
    )
    ORDER BY p.created_at DESC, p.id
    `,
    [accountId],
  );
  const selectedId = (await searchParams).role;
  const role = preparations.find(({ id }) => id === selectedId) ?? preparations[0];

  async function renderProgress() {
    if (!role) return null;
    const base = `/preparations/${role.id}`;
    const cv = await readCv(accountId, role.id);
    const comparison =
      cv &&
      (await one<{ score: number }>(
        `
      SELECT score FROM cv_comparisons WHERE preparation_id = $1 AND cv_version = $2 AND job_version = $3
      `,
        [role.id, cv.version, role.version],
      ));
    const diagnostic = await readDiagnostic(accountId, role.id, role.version);
    const attempts = await readReassessments(accountId, role.id, role.version);
    const latest = attempts.at(-1);
    const scored = attempts.findLast(({ score }) => score !== null);
    const required = await readTrainingRequirements(accountId, role.id, role.version);
    const covered = required.length > 0 && required.every(({ title }) => hasCoverage(title));
    const ready = covered && hasReadiness(attempts);
    let action = { label: "Upload your CV", path: "setup" };
    if (latest?.score === null) action = { label: copy.resumeReassessment, path: "reassessment" };
    else if (diagnostic?.submittedAt === null) action = { label: copy.resumeDiagnostic, path: "diagnostic" };
    else if (ready) action = { label: "Review revised CV", path: "revised-cv" };
    else if (cv && !comparison) action = { label: "Compare your CV", path: "analysis" };
    else if (comparison && (!covered || !diagnostic)) action = { label: "View practice available", path: "offer" };
    else if (diagnostic?.submittedAt && latest) action = { label: copy.reviewReassessment, path: "reassessment" };
    else if (diagnostic?.submittedAt) action = { label: "Review skill check and practice", path: "diagnostic" };

    return (
      <section className="role-progress" aria-labelledby="selected-role">
        <h2 id="selected-role">{role.title}</h2>
        <p>{ready ? copy.readinessMet : copy.inProgress}</p>
        <Link className="button" href={`${base}/${action.path}`}>{action.label}</Link>
        <dl className="dashboard-scores">
          <div><dt>{copy.cvFitEstimate}</dt><dd>{comparison ? `${comparison.score}%` : "Comparison pending"}</dd></div>
          <div><dt>SQL joins assessment</dt><dd>{scored ? `${scored.score}% · ${copy.reassessment}` :
            diagnostic?.score != null ? `${diagnostic.score}% · ${copy.diagnostic}` : copy.untested}</dd></div>
        </dl>
        <nav className="header-links" aria-label="Selected preparation">
          <Link href={`${base}/setup`}>Preparation setup</Link>
          {diagnostic?.submittedAt && <Link href={`${base}/diagnostic`}>{copy.diagnosticFeedback}</Link>}
          {latest && latest.score !== null && <Link href={`${base}/reassessment`}>{copy.reassessmentFeedback}</Link>}
        </nav>
      </section>
    );
  }

  return (
    <main className="shell form-page dashboard">
      <Link href="/">MiniProject</Link>
      <h1>Your preparations</h1>
      <p><Link href="/jobs">Job search</Link></p>
      {profile ? <Link className="button" href="/preparations/new">{copy.addJobTitle}</Link> : <Link href="/profile">Complete your profile</Link>}
      {preparations.length ? (
        <nav aria-label="Select a role">
          <ul>{preparations.map(({ id, title }) => (
            <li key={id}><Link href={`/dashboard?role=${encodeURIComponent(id)}`} aria-current={role?.id === id ? "page" : undefined}>{title}</Link></li>
          ))}</ul>
        </nav>
      ) : <p>{copy.noJobsYet}</p>}
      {await renderProgress()}
      <form action={signOut}><button className="text-button">Sign out</button></form>
    </main>
  );
}
