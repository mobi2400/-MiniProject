import { many, one } from "./db";
import { readCv } from "./cv";
import type { Requirement } from "./cv-fit";
import { qualifyingAttempts, readinessThreshold } from "./training-bank";

type Question = { prompt: string; options: string[]; answer: number; feedback: string };

export async function readReassessments(account: string, id: string, jobVersion: number) {
  const rows = await many<{
    sequence: number;
    question_id: string;
    question_json: string;
    selected_answer: number | null;
    score: number | null;
  }>(
    `
    SELECT a.sequence, a.question_id, a.question_json, a.selected_answer, a.score
    FROM reassessments a JOIN preparations p ON p.id = a.preparation_id
    WHERE p.account_id = $1 AND p.id = $2 AND a.job_version = $3
    ORDER BY a.sequence
    `,
    [account, id, jobVersion],
  );
  return rows.map((row) => ({ ...row, question: JSON.parse(row.question_json) as Question }));
}

export function hasReadiness(attempts: { score: number | null }[]) {
  const latest = attempts.slice(-qualifyingAttempts);
  return (
    latest.length === qualifyingAttempts &&
    latest.every(({ score }) => score !== null && score >= readinessThreshold)
  );
}

export async function readTrainingRequirements(account: string, id: string, jobVersion: number) {
  const cv = await readCv(account, id);
  const comparison =
    cv &&
    (await one<{ items_json: string }>(
      `
      SELECT c.items_json FROM cv_comparisons c JOIN preparations p ON p.id = c.preparation_id
      WHERE p.account_id = $1 AND p.id = $2 AND c.cv_version = $3 AND c.job_version = $4
      `,
      [account, id, cv.version, jobVersion],
    ));
  return comparison ? (JSON.parse(comparison.items_json) as Requirement[]).filter((item) => item.required) : [];
}

export async function readDiagnostic(account: string, id: string, jobVersion: number) {
  const row = await one<{
    question_json: string;
    submitted_at: number | null;
    selected_answer: number | null;
    score: number | null;
  }>(
    `
    SELECT a.question_json, a.submitted_at, a.selected_answer, a.score
    FROM diagnostic_attempts a JOIN preparations p ON p.id = a.preparation_id
    WHERE p.account_id = $1 AND p.id = $2 AND a.job_version = $3
    `,
    [account, id, jobVersion],
  );
  return (
    row && {
      submittedAt: row.submitted_at,
      selected: row.selected_answer,
      score: row.score,
      question: JSON.parse(row.question_json) as Question,
    }
  );
}
