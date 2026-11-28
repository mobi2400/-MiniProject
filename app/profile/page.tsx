import Link from "next/link";
import { one } from "../../lib/db";
import { requireAccount } from "../../lib/session";
import { signOut } from "../account/actions";
import { ProfileForm } from "./profile-form";

export default async function Profile() {
  const accountId = await requireAccount();
  const profile = await one<{ name: string; career_goal: string }>(
    "SELECT name, career_goal FROM profiles WHERE account_id = $1",
    [accountId],
  );

  return (
    <main className="shell form-page" id="main-content">
      <Link href="/">MiniProject</Link>
      <h1>Candidate profile</h1>
      <ProfileForm name={profile?.name ?? ""} goal={profile?.career_goal ?? ""} />
      {profile && <p><Link href="/dashboard">Your preparations</Link></p>}
      <form action={signOut}><button className="text-button">Sign out</button></form>
    </main>
  );
}
