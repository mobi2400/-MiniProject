"use server";

import { redirect } from "next/navigation";
import { db } from "../../../lib/db";
import { createPreparation } from "../../../lib/preparations";
import { requireAccount } from "../../../lib/session";

export async function submitTargetJob(id: string, _: string, data: FormData) {
  const accountId = await requireAccount();
  if (!db().prepare("SELECT 1 FROM profiles WHERE account_id = ?").get(accountId)) redirect("/profile");
  const rawTitle = data.get("title");
  const rawDescription = data.get("description");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const description = typeof rawDescription === "string" ? rawDescription.trim() : "";
  if (!title || title.length > 160 || !description || description.length > 20000) {
    return "Enter a role title and job description within the listed limits.";
  }
  try {
    createPreparation(accountId, id, title, description);
  } catch {
    return "The target job could not be saved. Try again.";
  }
  redirect(`/preparations/${id}/setup`);
}
