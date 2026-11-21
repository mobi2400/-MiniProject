import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { one } from "../../../lib/db";
import { requireAccount } from "../../../lib/session";
import { JobForm } from "./job-form";

export default async function NewPreparation() {
  const accountId = await requireAccount();
  const profile = await one("SELECT 1 FROM profiles WHERE account_id = $1", [accountId]);
  if (!profile) redirect("/profile");
  return (
    <main className="shell form-page">
      <Link href="/dashboard">Your preparations</Link>
      <h1>Add a target job</h1>
      <JobForm id={randomUUID()} />
    </main>
  );
}
