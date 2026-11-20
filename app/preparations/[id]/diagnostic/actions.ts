"use server";

import { notFound, redirect } from "next/navigation";
import { db } from "../../../../lib/db";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { readDiagnostic, readTrainingRequirements } from "../../../../lib/training";
import { hasCoverage, sqlJoinQuestions } from "../../../../lib/training-bank";

export async function startDiagnostic(id: string) {
  const account = await requireAccount();
  const job = readTargetJob(account, id);
  if (!job) notFound();
  const required = readTrainingRequirements(account, id, job.version);
  if (!required.length || required.some(({ title }) => !hasCoverage(title))) redirect(`/preparations/${id}/offer`);
  db().prepare(`
    INSERT INTO diagnostic_attempts (preparation_id, job_version, question_json)
    VALUES (?, ?, ?) ON CONFLICT (preparation_id, job_version) DO NOTHING
  `).run(id, job.version, JSON.stringify(sqlJoinQuestions[0]));
  redirect(`/preparations/${id}/diagnostic`);
}

export async function submitDiagnostic(id: string, version: number, data: FormData) {
  const account = await requireAccount();
  const job = readTargetJob(account, id);
  if (!job || job.version !== version) notFound();
  const attempt = readDiagnostic(account, id, version);
  if (!attempt) notFound();
  const raw = data.get("answer");
  if (typeof raw !== "string" || !/^\d+$/u.test(raw) || Number(raw) >= attempt.question.options.length) {
    redirect(`/preparations/${id}/diagnostic?answer=required`);
  }
  const answer = Number(raw);
  db().prepare(`
    UPDATE diagnostic_attempts SET submitted_at = ?, selected_answer = ?, score = ?
    WHERE preparation_id = ? AND job_version = ? AND submitted_at IS NULL
      AND EXISTS (SELECT 1 FROM preparations WHERE id = ? AND account_id = ?)
  `).run(Date.now(), answer, answer === attempt.question.answer ? 100 : 0, id, version, id, account);
  redirect(`/preparations/${id}/diagnostic`);
}
