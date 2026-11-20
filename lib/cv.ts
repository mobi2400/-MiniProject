import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { CvEvidence } from "./cv-text";

export function saveCv(accountId: string, preparationId: string, filename: string, bytes: Uint8Array, evidence: CvEvidence[]) {
  return db().prepare(`
    INSERT INTO cv_versions (id, preparation_id, version, filename, source, evidence_json)
    SELECT ?, p.id, COALESCE((SELECT MAX(version) FROM cv_versions WHERE preparation_id = p.id), 0) + 1, ?, ?, ?
    FROM preparations p WHERE p.id = ? AND p.account_id = ?
  `).run(randomUUID(), filename, bytes, JSON.stringify(evidence), preparationId, accountId).changes === 1;
}

export function readCv(accountId: string, preparationId: string) {
  const row = db().prepare(`
    SELECT c.filename, c.version, c.evidence_json
    FROM cv_versions c JOIN preparations p ON p.id = c.preparation_id
    WHERE p.id = ? AND p.account_id = ? ORDER BY c.version DESC LIMIT 1
  `).get(preparationId, accountId) as { filename: string; version: number; evidence_json: string } | undefined;
  return row && { filename: row.filename, version: row.version, evidence: JSON.parse(row.evidence_json) as CvEvidence[] };
}
