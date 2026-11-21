"use server";

import { notFound, redirect } from "next/navigation";
import { run, tx } from "../../../../lib/db";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { hasReadiness, readDiagnostic, readReassessments, readTrainingRequirements } from "../../../../lib/training";
import { hasCoverage, sqlJoinQuestions } from "../../../../lib/training-bank";

export async function startReassessment(id: string, expectedCount: number) {
  const account = await requireAccount();
  const job = await readTargetJob(account, id);
  if (!job) notFound();
  const diag = await readDiagnostic(account, id, job.version);
  if (!diag?.submittedAt) redirect(`/preparations/${id}/offer`);
  const required = await readTrainingRequirements(account, id, job.version);
  if (!required.length || required.some(({ title }) => !hasCoverage(title))) redirect(`/preparations/${id}/offer`);

  await tx(async (client) => {
    await client.query(
      "SELECT 1 FROM target_job_versions WHERE preparation_id = $1 AND version = $2 FOR UPDATE",
      [id, job.version],
    );

    const attemptsRes = await client.query(
      `
      SELECT a.sequence, a.question_id, a.question_json, a.selected_answer, a.score
      FROM reassessments a JOIN preparations p ON p.id = a.preparation_id
      WHERE p.account_id = $1 AND p.id = $2 AND a.job_version = $3
      ORDER BY a.sequence
      `,
      [account, id, job.version],
    );
    const attempts = attemptsRes.rows as {
      sequence: number;
      question_id: string;
      question_json: string;
      selected_answer: number | null;
      score: number | null;
    }[];

    const question = sqlJoinQuestions.slice(1).find(({ id: questionId }) =>
      !attempts.some(({ question_id }) => question_id === questionId));

    if (
      question &&
      attempts.length === expectedCount &&
      !attempts.some(({ score }) => score === null) &&
      !hasReadiness(attempts)
    ) {
      await client.query(
        `
        INSERT INTO reassessments (preparation_id, job_version, sequence, question_id, question_json)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [id, job.version, attempts.length + 1, question.id, JSON.stringify(question)],
      );
    }
  });

  redirect(`/preparations/${id}/reassessment`);
}

export async function submitReassessment(id: string, version: number, sequence: number, data: FormData) {
  const account = await requireAccount();
  const job = await readTargetJob(account, id);
  if (!job || job.version !== version) notFound();
  const attempts = await readReassessments(account, id, version);
  const attempt = attempts.find((item) => item.sequence === sequence);
  if (!attempt) notFound();
  const raw = data.get("answer");
  if (typeof raw === "string" && /^\d+$/u.test(raw) && Number(raw) < attempt.question.options.length) {
    const selected = Number(raw);
    await run(
      `
      UPDATE reassessments SET selected_answer = $1, score = $2
      WHERE preparation_id = $3 AND job_version = $4 AND sequence = $5 AND score IS NULL
        AND EXISTS (SELECT 1 FROM preparations WHERE id = $6 AND account_id = $7)
      `,
      [selected, selected === attempt.question.answer ? 100 : 0, id, version, sequence, id, account],
    );
  }
  redirect(`/preparations/${id}/reassessment`);
}
