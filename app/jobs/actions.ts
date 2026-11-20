"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../lib/db";
import { parseJobTitles } from "../../lib/job-search-titles";
import { requireAccount } from "../../lib/session";

type SearchTitleState = { error?: string; titles?: string[] };

export async function saveSearchTitles(_: SearchTitleState, form: FormData): Promise<SearchTitleState> {
  const account = await requireAccount();
  const raw = form.get("titles");
  const titles = typeof raw === "string" && raw.length <= 3000 ? parseJobTitles(raw) : null;
  if (!titles) return { error: "Enter up to 10 titles, with no more than 100 characters per title." };
  db().prepare(`
    INSERT INTO job_search_preferences (account_id, titles_json) VALUES (?, ?)
    ON CONFLICT (account_id) DO UPDATE SET titles_json = excluded.titles_json
  `).run(account, JSON.stringify(titles));
  revalidatePath("/jobs");
  return { titles };
}
