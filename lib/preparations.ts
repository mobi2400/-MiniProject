import { one, run, tx } from "./db";

export async function deletePreparation(accountId: string, preparationId: string): Promise<void> {
  await run("DELETE FROM preparations WHERE id = $1 AND account_id = $2", [preparationId, accountId]);
}

export async function readTargetJob(
  accountId: string,
  preparationId: string,
): Promise<{ title: string; description: string; version: number } | undefined> {
  return await one<{ title: string; description: string; version: number }>(
    `
    SELECT j.title, j.description, j.version
    FROM preparations p JOIN target_job_versions j ON j.preparation_id = p.id
    WHERE p.id = $1 AND p.account_id = $2
    ORDER BY j.version DESC LIMIT 1
    `,
    [preparationId, accountId],
  );
}

export type ListingSnapshot = { sourceId: string; listingId: string; url: string; company: string; location: string };

export async function readListingSnapshot(
  accountId: string,
  id: string,
): Promise<
  | {
      url: string;
      company: string;
      location: string;
      source_id: string;
      listing_id: string;
      status: "open" | "closed" | null;
    }
  | undefined
> {
  return await one<{
    url: string;
    company: string;
    location: string;
    source_id: string;
    listing_id: string;
    status: "open" | "closed" | null;
  }>(
    `
    SELECT s.url, s.company, s.location, s.source_id, s.listing_id, c.status
    FROM listing_snapshots s JOIN preparations p ON p.id = s.preparation_id
    LEFT JOIN listing_checks c ON c.preparation_id = s.preparation_id
    WHERE p.id = $1 AND p.account_id = $2
    `,
    [id, accountId],
  );
}

export async function saveListingStatus(
  account: string,
  id: string,
  status: "open" | "closed",
  checkedAt: number,
): Promise<void> {
  await run(
    `
    INSERT INTO listing_checks (preparation_id, status, checked_at)
    SELECT p.id, $1, $2 FROM preparations p JOIN listing_snapshots s ON s.preparation_id = p.id
    WHERE p.id = $3 AND p.account_id = $4
    ON CONFLICT (preparation_id) DO UPDATE SET status = excluded.status, checked_at = excluded.checked_at
    WHERE excluded.checked_at >= listing_checks.checked_at
    `,
    [status, checkedAt, id, account],
  );
}

export async function createPreparation(
  accountId: string,
  id: string,
  title: string,
  description: string,
  listing?: ListingSnapshot,
): Promise<void> {
  await tx(async (client) => {
    await client.query("SELECT 1 FROM profiles WHERE account_id = $1 FOR UPDATE", [accountId]);

    const existingRes = await client.query(
      `
      SELECT j.title, j.description, j.version
      FROM preparations p JOIN target_job_versions j ON j.preparation_id = p.id
      WHERE p.id = $1 AND p.account_id = $2
      ORDER BY j.version DESC LIMIT 1
      `,
      [id, accountId],
    );
    const existing = existingRes.rows[0] as { title: string; description: string; version: number } | undefined;

    if (existing) {
      if (!listing && (existing.title !== title || existing.description !== description)) {
        throw new Error("Conflicting preparation request");
      }
    } else {
      await client.query("INSERT INTO preparations VALUES ($1, $2, $3)", [id, accountId, Date.now()]);
      await client.query("INSERT INTO target_job_versions VALUES ($1, 1, $2, $3)", [id, title, description]);
      if (listing) {
        await client.query(
          `
          INSERT INTO listing_snapshots (preparation_id, source_id, listing_id, url, company, location, captured_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [id, listing.sourceId, listing.listingId, listing.url, listing.company, listing.location, Date.now()],
        );
      }
    }
  });
}
