import Link from "next/link";
import { readCv } from "../../lib/cv";
import { many, one } from "../../lib/db";
import { requireAccount } from "../../lib/session";
import { readDiagnostic, readReassessments, readTrainingRequirements, hasReadiness } from "../../lib/training";
import { hasCoverage } from "../../lib/training-bank";
import { getStage } from "../../lib/journey";
import { copy } from "../../lib/copy";
import { skillLabel } from "../../lib/skill-label";

const nextStepReason: Record<number, string> = {
  1: "Save the job description and upload your CV so we can compare them.",
  2: "Compare your CV with this job to see which skills it supports.",
  3: "Start the skill check to find out which skills need practice.",
  4: "Keep practicing until you get two correct skill checks in a row.",
  5: "Your revised CV is ready to review and download.",
};

type Prep = { id: string; title: string; version: number };

async function loadRoleDetails(accountId: string, prep: Prep) {
  const cv = await readCv(accountId, prep.id);
  const [comparison, diagnostic, attempts, required] = await Promise.all([
    cv
      ? one<{ score: number }>(
          "SELECT score FROM cv_comparisons WHERE preparation_id = $1 AND cv_version = $2 AND job_version = $3",
          [prep.id, cv.version, prep.version],
        )
      : Promise.resolve(undefined),
    readDiagnostic(accountId, prep.id, prep.version),
    readReassessments(accountId, prep.id, prep.version),
    readTrainingRequirements(accountId, prep.id, prep.version),
  ]);
  return { comparison, diagnostic, attempts, required };
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const accountId = await requireAccount();
  const profile = await one("SELECT 1 FROM profiles WHERE account_id = $1", [accountId]);
  const preparations = await many<Prep>(
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
    preparations.map(async (prep) => ({ prep, stage: await getStage(accountId, prep.id) })),
  );

  const selectedId = (await searchParams).role;
  const selected = prepStages.find(({ prep }) => prep.id === selectedId) ?? prepStages[0];

  const details = selected ? await loadRoleDetails(accountId, selected.prep) : null;
  const ready = details ? details.required.length > 0 && details.required.every(({ title }) => hasCoverage(title)) && hasReadiness(details.attempts) : false;
  const scored = details?.attempts.filter(({ score }) => score !== null) ?? [];
  const history = [
    ...(details?.diagnostic?.submittedAt
      ? [{ key: "diagnostic", label: copy.diagnostic, score: details.diagnostic.score, href: `/preparations/${selected?.prep.id}/diagnostic` }]
      : []),
    ...scored.map((attempt, index) => ({
      key: `check-${attempt.sequence}`,
      label: `${copy.reassessment} ${index + 1}`,
      score: attempt.score,
      href: `/preparations/${selected?.prep.id}/reassessment`,
    })),
  ];

  return (
    <main className="page-shell dashboard-page" id="main-content">
      <header className="page-title-block">
        <p className="kicker">Dashboard</p>
        <h1>Your preparations</h1>
        {!profile && (
          <p className="list-row-meta">
            Add your name and career goal first so we can personalize your preparation.{" "}
            <Link href="/profile">Complete profile</Link>
          </p>
        )}
      </header>

      {selected && details && (
        <div className="page-stack">
          <section className="card" aria-labelledby="selected-role">
            <div className="card-header">
              <div>
                <p className="kicker">Selected job</p>
                <h2 id="selected-role" className="card-title">{selected.prep.title}</h2>
                <p className="list-row-meta">
                  Step {selected.stage.step} of 5: <strong>{selected.stage.name}</strong> · {ready ? copy.readinessMet : copy.inProgress}
                </p>
              </div>
              {prepStages.length > 1 && (
                <form method="get" action="/dashboard" className="switch-role">
                  <label>
                    Switch job
                    <select name="role" defaultValue={selected.prep.id}>
                      {prepStages.map(({ prep }) => (
                        <option key={prep.id} value={prep.id}>{prep.title}</option>
                      ))}
                    </select>
                  </label>
                  <button className="button-secondary">Show</button>
                </form>
              )}
            </div>
          </section>

          <section className="card next-card" aria-labelledby="next-step">
            <h2 id="next-step" className="card-title">Next step</h2>
            <p>{nextStepReason[selected.stage.step]}</p>
            <Link className="button" href={selected.stage.nextAction.href}>{selected.stage.nextAction.label}</Link>
          </section>

          <div className="grid-2">
            <section className="card" aria-labelledby="skills-heading">
              <h2 id="skills-heading" className="card-title">Skills for this role</h2>
              {details.required.length ? (
                <ul className="list">
                  {details.required.map((item) => (
                    <li key={item.id} className="list-row">
                      <span>{skillLabel(item.title)}</span>
                      {hasCoverage(item.title) ? (
                        <span className="badge badge-ok">Practice available</span>
                      ) : (
                        <span className="badge badge-warn">No practice yet</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="list-row-meta">{copy.compareFirstPrompt}</p>
              )}
            </section>

            <section className="card" aria-labelledby="match-heading">
              <h2 id="match-heading" className="card-title">{copy.cvFitEstimate}</h2>
              <dl className="dashboard-scores">
                <div>
                  <dt>CV match</dt>
                  <dd>{details.comparison ? `${details.comparison.score}%` : "Not compared yet"}</dd>
                </div>
                <div>
                  <dt>Skill check</dt>
                  <dd>{scored.length ? `${scored.length} answered` : copy.untested}</dd>
                </div>
              </dl>
              <div className="cluster">
                <Link href={`/preparations/${selected.prep.id}/setup`}>Edit job and CV</Link>
                <Link href={`/preparations/${selected.prep.id}/analysis`}>View match</Link>
              </div>
            </section>
          </div>

          <section className="card" aria-labelledby="history-heading">
            <h2 id="history-heading" className="card-title">Skill checks</h2>
            {history.length ? (
              <ul className="list">
                {history.map((row) => (
                  <li key={row.key} className="list-row">
                    <div className="list-row-main">
                      <strong>{row.label}</strong>
                    </div>
                    <div className="cluster">
                      <span className={`badge ${row.score === 100 ? "badge-ok" : "badge-warn"}`}>
                        {row.score === 100 ? "Correct" : "Not correct"}
                      </span>
                      <Link href={row.href}>View feedback</Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="list-row-meta">No skill checks yet. Start your first one from the Next step card.</p>
            )}
          </section>

          <section className="card" aria-labelledby="revised-heading">
            <h2 id="revised-heading" className="card-title">Revised CV</h2>
            {ready ? (
              <Link className="button-secondary" href={`/preparations/${selected.prep.id}/revised-cv`}>Review revised CV</Link>
            ) : (
              <p className="list-row-meta">Available after two correct skill checks in a row.</p>
            )}
          </section>
        </div>
      )}

      <section className="card" aria-labelledby="jobs-heading">
        <div className="card-header">
          <h2 id="jobs-heading" className="card-title">Your jobs</h2>
          <Link className="button-secondary" href="/preparations/new">{copy.addJobTitle}</Link>
        </div>
        {prepStages.length ? (
          <ul className="list">
            {prepStages.map(({ prep, stage }) => (
              <li key={prep.id} className="list-row" aria-current={prep.id === selected?.prep.id ? "true" : undefined}>
                <div className="list-row-main">
                  <Link href={`/dashboard?role=${encodeURIComponent(prep.id)}`}>{prep.title}</Link>
                  <div className="list-row-meta">Step {stage.step} of 5: {stage.name}</div>
                </div>
                <Link className="button-secondary" href={stage.nextAction.href}>Continue</Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p>{copy.noJobsDashboard}</p>
            <Link className="button" href="/preparations/new">{copy.addJobTitle}</Link>
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="find-jobs-heading">
        <h2 id="find-jobs-heading" className="card-title">Find jobs that match your CV</h2>
        <p className="list-row-meta">Search job opportunities matching your skills and titles.</p>
        <Link className="button-secondary" href="/jobs">Search jobs</Link>
      </section>
    </main>
  );
}
