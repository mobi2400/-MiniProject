import { randomUUID } from "node:crypto";
import { one, run } from "./db";
import type { CvEvidence } from "./cv-text";

export async function saveCvCorrection(
  accountId: string,
  preparationId: string,
  version: number,
  evidence: CvEvidence[],
): Promise<boolean> {
  const count = await run(
    `
    INSERT INTO cv_versions (id, preparation_id, version, filename, source, evidence_json)
    SELECT $1, c.preparation_id, c.version + 1, c.filename, c.source, $2
    FROM cv_versions c JOIN preparations p ON p.id = c.preparation_id
    WHERE p.id = $3 AND p.account_id = $4 AND c.version = $5
      AND c.version = (SELECT MAX(version) FROM cv_versions WHERE preparation_id = p.id)
    `,
    [randomUUID(), JSON.stringify(evidence), preparationId, accountId, version],
  );
  return count === 1;
}

export async function saveCv(
  accountId: string,
  preparationId: string,
  filename: string,
  bytes: Uint8Array,
  evidence: CvEvidence[],
): Promise<boolean> {
  const count = await run(
    `
    INSERT INTO cv_versions (id, preparation_id, version, filename, source, evidence_json)
    SELECT $1, p.id, COALESCE((SELECT MAX(version) FROM cv_versions WHERE preparation_id = p.id), 0) + 1, $2, $3, $4
    FROM preparations p WHERE p.id = $5 AND p.account_id = $6
    `,
    [randomUUID(), filename, Buffer.from(bytes), JSON.stringify(evidence), preparationId, accountId],
  );
  return count === 1;
}

export async function readCv(
  accountId: string,
  preparationId: string,
): Promise<{ filename: string; version: number; evidence: CvEvidence[] } | undefined> {
  const row = await one<{ filename: string; version: number; evidence_json: string }>(
    `
    SELECT c.filename, c.version, c.evidence_json
    FROM cv_versions c JOIN preparations p ON p.id = c.preparation_id
    WHERE p.id = $1 AND p.account_id = $2 ORDER BY c.version DESC LIMIT 1
    `,
    [preparationId, accountId],
  );
  return row ? { filename: row.filename, version: row.version, evidence: JSON.parse(row.evidence_json) as CvEvidence[] } : undefined;
}
