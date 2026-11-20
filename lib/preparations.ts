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

export function createPreparation(accountId: string, id: string, title: string, description: string) {
  const connection = db();
  connection.exec("BEGIN IMMEDIATE");
  try {
    const existing = readTargetJob(accountId, id);
    if (existing) {
      if (existing.title !== title || existing.description !== description) throw new Error("Conflicting preparation request");
    } else {
      connection.prepare("INSERT INTO preparations VALUES (?, ?, ?)").run(id, accountId, Date.now());
      connection.prepare("INSERT INTO target_job_versions VALUES (?, 1, ?, ?)").run(id, title, description);
    }
    connection.exec("COMMIT");
  } catch (error) {
    connection.exec("ROLLBACK");
    throw error;
  }
}
