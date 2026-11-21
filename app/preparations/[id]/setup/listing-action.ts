"use server";

import { revalidatePath } from "next/cache";
import { checkListingStatus } from "../../../../lib/job-listing";
import { configuredBoards } from "../../../../lib/job-sources";
import { readListingSnapshot, saveListingStatus } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";

export async function refreshListing(id: string): Promise<string> {
  const account = await requireAccount();
  const snapshot = await readListingSnapshot(account, id);
  const board = configuredBoards().find(({ id }) => id === snapshot?.source_id);
  if (!snapshot || !board) return "This posting’s source is unavailable for status checks.";
  const checkedAt = Date.now();
  try {
    const status = await checkListingStatus(board, snapshot.listing_id);
    await saveListingStatus(account, id, status, checkedAt);
  } catch {
    return "The source did not respond. Try checking again later.";
  }
  revalidatePath(`/preparations/${id}/setup`);
  return "";
}
