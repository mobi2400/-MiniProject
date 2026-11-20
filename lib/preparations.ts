import { db } from "./db";

export function deletePreparation(accountId: string, preparationId: string) {
  db().prepare("DELETE FROM preparations WHERE id = ? AND account_id = ?").run(preparationId, accountId);
}

export function readTargetJob(accountId: string, preparationId: string) {
  return db().prepare(`
    SELECT j.title, j.description, j.version
    FROM preparations p JOIN target_job_versions j ON j.preparation_id = p.id
    WHERE p.id = ? AND p.account_id = ?
    ORDER BY j.version DESC LIMIT 1
  `).get(preparationId, accountId) as { title: string; description: string; version: number } | undefined;
}

type ListingSnapshot = { sourceId: string; listingId: string; url: string; company: string; location: string };

export function readListingSnapshot(accountId: string, id: string) {
  return db().prepare(`
    SELECT s.url, s.company, s.location, s.source_id, s.listing_id, c.status
    FROM listing_snapshots s JOIN preparations p ON p.id = s.preparation_id
    LEFT JOIN listing_checks c ON c.preparation_id = s.preparation_id
    WHERE p.id = ? AND p.account_id = ?
  `).get(id, accountId) as {
    url: string; company: string; location: string; source_id: string; listing_id: string;
    status: "open" | "closed" | null;
  } | undefined;
}

export function saveListingStatus(account: string, id: string, status: "open" | "closed", checkedAt: number) {
  db().prepare(`
    INSERT INTO listing_checks (preparation_id, status, checked_at)
    SELECT p.id, ?, ? FROM preparations p JOIN listing_snapshots s ON s.preparation_id = p.id
    WHERE p.id = ? AND p.account_id = ?
    ON CONFLICT (preparation_id) DO UPDATE SET status = excluded.status, checked_at = excluded.checked_at
    WHERE excluded.checked_at >= listing_checks.checked_at
  `).run(status, checkedAt, id, account);
}

export function createPreparation(accountId: string, id: string, title: string, description: string, listing?: ListingSnapshot) {
  const connection = db();
  connection.exec("BEGIN IMMEDIATE");
  try {
    const existing = readTargetJob(accountId, id);
    if (existing) {
      if (!listing && (existing.title !== title || existing.description !== description)) throw new Error("Conflicting preparation request");
    } else {
      connection.prepare("INSERT INTO preparations VALUES (?, ?, ?)").run(id, accountId, Date.now());
      connection.prepare("INSERT INTO target_job_versions VALUES (?, 1, ?, ?)").run(id, title, description);
      if (listing) connection.prepare(`
        INSERT INTO listing_snapshots (preparation_id, source_id, listing_id, url, company, location, captured_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, listing.sourceId, listing.listingId, listing.url, listing.company, listing.location, Date.now());
    }
    connection.exec("COMMIT");
  } catch (error) {
    connection.exec("ROLLBACK");
    throw error;
  }
}
