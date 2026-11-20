"use server";

import { notFound, redirect } from "next/navigation";
import { db } from "../../../../lib/db";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { hasReadiness, readDiagnostic, readReassessments, readTrainingRequirements } from "../../../../lib/training";
import { hasCoverage, sqlJoinQuestions } from "../../../../lib/training-bank";

export async function startReassessment(id: string, expectedCount: number) {
  const account = await requireAccount();
  const job = readTargetJob(account, id);
  if (!job) notFound();
  if (!readDiagnostic(account, id, job.version)?.submittedAt) redirect(`/preparations/${id}/offer`);
  const required = readTrainingRequirements(account, id, job.version);
  if (!required.length || required.some(({ title }) => !hasCoverage(title))) redirect(`/preparations/${id}/offer`);
  const connection = db();
  connection.exec("BEGIN IMMEDIATE");
  try {
    const attempts = readReassessments(account, id, job.version);
    const question = sqlJoinQuestions.slice(1).find(({ id: questionId }) =>
      !attempts.some(({ question_id }) => question_id === questionId));
    if (question && attempts.length === expectedCount &&
      !attempts.some(({ score }) => score === null) && !hasReadiness(attempts)) {
      connection.prepare(`
        INSERT INTO reassessments (preparation_id, job_version, sequence, question_id, question_json)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, job.version, attempts.length + 1, question.id, JSON.stringify(question));
    }
    connection.exec("COMMIT");
  } catch (error) {
    connection.exec("ROLLBACK");
    throw error;
  }
  redirect(`/preparations/${id}/reassessment`);
}

export async function submitReassessment(id: string, version: number, sequence: number, data: FormData) {
  const account = await requireAccount();
  const job = readTargetJob(account, id);
  if (!job || job.version !== version) notFound();
  const attempt = readReassessments(account, id, version).find((item) => item.sequence === sequence);
  if (!attempt) notFound();
  const raw = data.get("answer");
  if (typeof raw === "string" && /^\d+$/u.test(raw) && Number(raw) < attempt.question.options.length) {
    const selected = Number(raw);
    db().prepare(`
      UPDATE reassessments SET selected_answer = ?, score = ?
      WHERE preparation_id = ? AND job_version = ? AND sequence = ? AND score IS NULL
        AND EXISTS (SELECT 1 FROM preparations WHERE id = ? AND account_id = ?)
    `).run(selected, selected === attempt.question.answer ? 100 : 0, id, version, sequence, id, account);
  }
  redirect(`/preparations/${id}/reassessment`);
}
