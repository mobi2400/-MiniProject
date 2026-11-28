import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { one } from "../../../lib/db";
import { requireAccount } from "../../../lib/session";
import { copy } from "../../../lib/copy";
import { JobForm } from "./job-form";

export default async function NewPreparation() {
  const accountId = await requireAccount();
  const profile = await one("SELECT 1 FROM profiles WHERE account_id = $1", [accountId]);
  if (!profile) redirect("/profile");
  return (
    <main className="shell form-page" id="main-content">
      <Link href="/dashboard">Your preparations</Link>
      <h1>{copy.addJobTitle}</h1>
      <JobForm id={randomUUID()} />
    </main>
  );
}
