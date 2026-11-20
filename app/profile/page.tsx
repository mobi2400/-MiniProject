import Link from "next/link";
import { db } from "../../lib/db";
import { requireAccount } from "../../lib/session";
import { signOut } from "../account/actions";
import { ProfileForm } from "./profile-form";

export default async function Profile() {
  const accountId = await requireAccount();
  const profile = db().prepare("SELECT name, career_goal FROM profiles WHERE account_id = ?")
    .get(accountId) as { name: string; career_goal: string } | undefined;

  return (
    <main className="shell form-page">
      <Link href="/">MiniProject</Link>
      <h1>Candidate profile</h1>
      <ProfileForm name={profile?.name ?? ""} goal={profile?.career_goal ?? ""} />
      <form action={signOut}><button className="text-button">Sign out</button></form>
    </main>
  );
}
