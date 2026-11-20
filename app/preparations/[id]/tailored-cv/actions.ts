"use server";

import { notFound, redirect } from "next/navigation";
import { readCv } from "../../../../lib/cv";
import { readKeywordConfirmations } from "../../../../lib/keyword-confirmations";
import { readListingSnapshot, readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { buildTailoredEdits, saveTailoredDraft } from "../../../../lib/tailored-cv";

export async function generateTailoredDraft(id: string) {
  const account = await requireAccount();
  const job = readTargetJob(account, id);
  const cv = readCv(account, id);
  if (!job || !readListingSnapshot(account, id)) notFound();
  if (!cv) redirect(`/preparations/${id}/setup`);
  const edits = buildTailoredEdits(job.description, cv.evidence, readKeywordConfirmations(account, id, job.version));
  if (!saveTailoredDraft(account, id, job.version, cv.version, edits)) {
    redirect(`/preparations/${id}/tailored-cv?changed=1`);
  }
  redirect(`/preparations/${id}/tailored-cv`);
}
