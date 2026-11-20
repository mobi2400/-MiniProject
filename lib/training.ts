import { db } from "./db";
import { readCv } from "./cv";
import type { Requirement } from "./cv-fit";

export function readTrainingRequirements(account: string, id: string, jobVersion: number) {
  const cv = readCv(account, id);
  const comparison = cv && db().prepare(`
    SELECT c.items_json FROM cv_comparisons c JOIN preparations p ON p.id = c.preparation_id
    WHERE p.account_id = ? AND p.id = ? AND c.cv_version = ? AND c.job_version = ?
  `).get(account, id, cv.version, jobVersion) as { items_json: string } | undefined;
  return comparison ? (JSON.parse(comparison.items_json) as Requirement[]).filter((item) => item.required) : [];
}

export function readDiagnostic(account: string, id: string, jobVersion: number) {
  const row = db().prepare(`
    SELECT a.question_json, a.submitted_at, a.selected_answer, a.score
    FROM diagnostic_attempts a JOIN preparations p ON p.id = a.preparation_id
    WHERE p.account_id = ? AND p.id = ? AND a.job_version = ?
  `).get(account, id, jobVersion) as {
    question_json: string;
    submitted_at: number | null;
    selected_answer: number | null;
    score: number | null;
  } | undefined;
  return row && {
    submittedAt: row.submitted_at,
    selected: row.selected_answer,
    score: row.score,
    question: JSON.parse(row.question_json) as { prompt: string; options: string[]; answer: number; feedback: string },
  };
}
