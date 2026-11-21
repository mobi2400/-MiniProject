"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { many, one, run } from "../../lib/db";
import { readListing } from "../../lib/job-listing";
import { parseJobTitles } from "../../lib/job-search-titles";
import { configuredBoards, searchBoard } from "../../lib/job-sources";
import { createPreparation, readTargetJob } from "../../lib/preparations";
import { requireAccount } from "../../lib/session";

type SearchTitleState = { error?: string; titles?: string[] };

export async function prepareForListing(boardId: string, listingId: string) {
  const account = await requireAccount();
  const profile = await one("SELECT 1 FROM profiles WHERE account_id = $1", [account]);
  if (!profile) redirect("/profile");
  const board = configuredBoards().find(({ id }) => id === boardId);
  if (!board || !/^[1-9]\d{0,15}$/u.test(listingId)) return { error: "This listing is unavailable." };
  const id = createHash("sha256").update(JSON.stringify([account, boardId, listingId])).digest("hex");
  const existingJob = await readTargetJob(account, id);
  if (!existingJob) {
    try {
      const listing = await readListing(board, listingId);
      if (!listing) return { error: "This posting is no longer available or has no usable description." };
      await createPreparation(account, id, listing.title, listing.description, listing);
    } catch {
      return { error: "The posting could not be saved. Try again shortly." };
    }
  }
  redirect(`/preparations/${id}/setup`);
}

export async function searchSavedJobs(source?: string) {
  const account = await requireAccount();
  const saved = await one<{ titles_json: string }>(
    "SELECT titles_json FROM job_search_preferences WHERE account_id = $1",
    [account],
  );
  const titles = saved ? (JSON.parse(saved.titles_json) as string[]) : [];
  if (!titles.length) return { error: "Save at least one search title first." };
  const boards = configuredBoards().filter(({ id }) => !source || source === id);
  if (!boards.length) return { error: "No job boards are configured for this search." };
  const results = await Promise.all(boards.map((board) => searchBoard(board, titles)));
  const closed = await many<{ source_id: string; listing_id: string }>(
    `
    SELECT s.source_id, s.listing_id FROM listing_snapshots s
    JOIN listing_checks c ON c.preparation_id = s.preparation_id
    JOIN preparations p ON p.id = s.preparation_id
    WHERE p.account_id = $1 AND c.status = 'closed'
    `,
    [account],
  );
  const unavailable = new Set(closed.map((entry) => `${entry.source_id}:${entry.listing_id}`));
  return {
    results: results.map((result) =>
      "jobs" in result
        ? {
            ...result,
            jobs: result.jobs.filter((job) => !unavailable.has(`${result.board.id}:${job.listingId}`)),
          }
        : result,
    ),
  };
}

export async function saveSearchTitles(_: SearchTitleState, form: FormData): Promise<SearchTitleState> {
  const account = await requireAccount();
  const raw = form.get("titles");
  const titles = typeof raw === "string" && raw.length <= 3000 ? parseJobTitles(raw) : null;
  if (!titles) return { error: "Enter up to 10 titles, with no more than 100 characters per title." };
  await run(
    `
    INSERT INTO job_search_preferences (account_id, titles_json) VALUES ($1, $2)
    ON CONFLICT (account_id) DO UPDATE SET titles_json = excluded.titles_json
    `,
    [account, JSON.stringify(titles)],
  );
  revalidatePath("/jobs");
  return { titles };
}
