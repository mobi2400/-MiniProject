import Link from "next/link";
import { readCv } from "../../lib/cv";
import { one } from "../../lib/db";
import { suggestJobTitles } from "../../lib/job-search-titles";
import { requireAccount } from "../../lib/session";
import { TitleForm } from "./title-form";
import { SearchResults } from "./search-results";

export default async function Jobs() {
  const account = await requireAccount();
  const stored = await one<{ titles_json: string }>(
    "SELECT titles_json FROM job_search_preferences WHERE account_id = $1",
    [account],
  );
  const latest = await one<{ id: string }>(
    `
    SELECT p.id FROM preparations p
    WHERE p.account_id = $1 AND EXISTS (
      SELECT 1 FROM cv_versions c WHERE c.preparation_id = p.id
      AND c.version = (SELECT MAX(version) FROM cv_versions WHERE preparation_id = p.id)
      AND json_array_length(c.evidence_json::json) > 0
    )
    ORDER BY p.created_at DESC, p.id LIMIT 1
    `,
    [account],
  );
  const cv = latest && (await readCv(account, latest.id));
  return (
    <main className="shell form-page">
      <Link href="/dashboard">Your preparations</Link>
      <h1>Job search</h1>
      <TitleForm initialTitles={stored ? JSON.parse(stored.titles_json) as string[] : []}
        suggestions={suggestJobTitles(cv?.evidence ?? [])} />
      <SearchResults key={stored?.titles_json ?? ""} />
    </main>
  );
}
