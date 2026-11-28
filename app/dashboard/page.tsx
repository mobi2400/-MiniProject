import Link from "next/link";
import { readCv } from "../../lib/cv";
import { many, one } from "../../lib/db";
import { requireAccount } from "../../lib/session";
import { hasReadiness, readDiagnostic, readReassessments, readTrainingRequirements } from "../../lib/training";
import { hasCoverage } from "../../lib/training-bank";
import { getStage } from "../../lib/journey";
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

  const prepStages = await Promise.all(
    preparations.map(async (prep) => {
      const stage = await getStage(accountId, prep.id);
      return { prep, stage };
    }),
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
    const scored = attempts.findLast(({ score }) => score !== null);
    const required = await readTrainingRequirements(accountId, role.id, role.version);
    const covered = required.length > 0 && required.every(({ title }) => hasCoverage(title));
    const ready = covered && hasReadiness(attempts);
    const stage = await getStage(accountId, role.id);

    return (
      <section className="role-progress" aria-labelledby="selected-role">
        <h2 id="selected-role">{role.title}</h2>
        <p><strong>Step {stage.step} of 5: {stage.name}</strong> · {ready ? copy.readinessMet : copy.inProgress}</p>
        <Link className="button" href={stage.nextAction.href}>{stage.nextAction.label}</Link>
        <dl className="dashboard-scores" style={{ marginBlock: "1.25rem" }}>
          <div><dt>{copy.cvFitEstimate}</dt><dd>{comparison ? `${comparison.score}%` : "Comparison pending"}</dd></div>
          <div><dt>SQL joins assessment</dt><dd>{scored ? `${scored.score}% · ${copy.reassessment}` :
            diagnostic?.score != null ? `${diagnostic.score}% · ${copy.diagnostic}` : copy.untested}</dd></div>
        </dl>
        <nav className="header-links" aria-label="Selected preparation">
          <Link href={`${base}/setup`}>Preparation setup</Link>
          {diagnostic?.submittedAt && <Link href={`${base}/diagnostic`}>{copy.diagnosticFeedback}</Link>}
          {attempts.some((a) => a.score !== null) && <Link href={`${base}/reassessment`}>{copy.reassessmentFeedback}</Link>}
        </nav>
      </section>
    );
  }

  return (
    <main className="shell form-page dashboard" id="main-content">
      <Link href="/">MiniProject</Link>
      <h1>Your preparations</h1>

      <section className="card" aria-labelledby="find-jobs-heading">
        <h2 className="card-title" id="find-jobs-heading">Find jobs that match your CV</h2>
        <p className="list-row-meta">Search job opportunities matching your skills and titles.</p>
        <Link className="button button-secondary" href="/jobs">Search jobs</Link>
      </section>

      {!profile && (
        <p className="list-row-meta">
          Add your name and career goal first so we can personalize your preparation.{" "}
          <Link href="/profile">Complete profile</Link>
        </p>
      )}

      <div className="cluster">
        <Link className="button" href="/preparations/new">{copy.addJobTitle}</Link>
      </div>

      {prepStages.length ? (
        <section className="stack" aria-label="Saved preparation cards">
          {prepStages.map(({ prep, stage }) => {
            const isSelected = role?.id === prep.id;
            return (
              <div
                key={prep.id}
                className="card"
                style={isSelected ? { borderColor: "var(--indigo)", background: "var(--panel-muted)" } : undefined}
              >
                <div className="card-header">
                  <div>
                    <h3 className="card-title">
                      <Link href={`/dashboard?role=${encodeURIComponent(prep.id)}`}>{prep.title}</Link>
                    </h3>
                    <p className="list-row-meta">
                      Step {stage.step} of 5: <strong>{stage.name}</strong>
                    </p>
                  </div>
                  <Link className="button" href={stage.nextAction.href}>
                    Continue
                  </Link>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <div className="empty-state">
          <p>{copy.noJobsDashboard}</p>
        </div>
      )}

      {await renderProgress()}
      <form action={signOut} style={{ marginTop: "2rem" }}><button className="text-button">Sign out</button></form>
    </main>
  );
}