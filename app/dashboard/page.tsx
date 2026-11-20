import Link from "next/link";
import { db } from "../../lib/db";
import { requireAccount } from "../../lib/session";
import { signOut } from "../account/actions";

export default async function Dashboard() {
  const accountId = await requireAccount();
  const profile = db().prepare("SELECT 1 FROM profiles WHERE account_id = ?").get(accountId);
  const preparations = db().prepare(`
    SELECT p.id, j.title
    FROM preparations p JOIN target_job_versions j ON j.preparation_id = p.id
    WHERE p.account_id = ? AND j.version = (
      SELECT MAX(version) FROM target_job_versions WHERE preparation_id = p.id
    )
    ORDER BY p.created_at DESC, p.id
  `).all(accountId) as { id: string; title: string }[];

  return (
    <main className="shell form-page">
      <Link href="/">MiniProject</Link>
      <h1>Your preparations</h1>
      {profile ? <Link className="button" href="/preparations/new">Add a target job</Link> : <Link href="/profile">Complete your profile</Link>}
      {preparations.length ? (
        <ul>{preparations.map(({ id, title }) => (
          <li key={id}><Link href={`/preparations/${id}/setup`}>{title}</Link></li>
        ))}</ul>
      ) : <p>Your saved jobs will appear here.</p>}
      <form action={signOut}><button className="text-button">Sign out</button></form>
    </main>
  );
}
