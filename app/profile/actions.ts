"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../lib/db";
import { requireAccount } from "../../lib/session";

export async function saveProfile(_: string, formData: FormData): Promise<string> {
  const accountId = await requireAccount();
  const rawName = formData.get("name");
  const rawGoal = formData.get("careerGoal");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const goal = typeof rawGoal === "string" ? rawGoal.trim() : "";
  if (!name || name.length > 100 || goal.length > 200) {
    return "Enter a name up to 100 characters and a career goal up to 200 characters.";
  }
  db().prepare(`
    INSERT INTO profiles VALUES (?, ?, ?)
    ON CONFLICT(account_id) DO UPDATE SET name = excluded.name, career_goal = excluded.career_goal
  `).run(accountId, name, goal);
  revalidatePath("/profile");
  return "Profile saved.";
}
