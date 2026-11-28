import Link from "next/link";
import { one } from "../../lib/db";
import { requireAccount } from "../../lib/session";
import { ProfileForm } from "./profile-form";

export default async function Profile() {
  const accountId = await requireAccount();
  const profile = await one<{ name: string; career_goal: string }>(
    "SELECT name, career_goal FROM profiles WHERE account_id = $1",
    [accountId],
  );

  return (
    <main className="page-shell" id="main-content">
      <header className="page-title-block">
        <p className="kicker">Your profile</p>
        <h1>{profile?.name ? `Hi, ${profile.name}` : "Welcome"}</h1>
        <p className="auth-lead">Your name and career goal personalize every preparation.</p>
      </header>

      <div className="page-stack">
        <section className="card" aria-labelledby="details-heading">
          <h2 id="details-heading" className="card-title">Your details</h2>
          <ProfileForm name={profile?.name ?? ""} goal={profile?.career_goal ?? ""} />
        </section>

        <section className="card next-card" aria-labelledby="next-heading">
          <h2 id="next-heading" className="card-title">Next step</h2>
          <p>
            {profile
              ? "Open your jobs to add one you're preparing for, or compare your CV with it."
              : "Save your details, then add a job you're preparing for."}
          </p>
          <Link href="/dashboard" className="button">Go to your jobs</Link>
        </section>
      </div>
    </main>
  );
}
