"use server";

import { notFound, redirect } from "next/navigation";
import { readCv } from "../../../../lib/cv";
import { readKeywordConfirmations } from "../../../../lib/keyword-confirmations";
import { readListingSnapshot, readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";
import { buildTailoredEdits, saveTailoredDraft } from "../../../../lib/tailored-cv";

export async function generateTailoredDraft(id: string) {
  const account = await requireAccount();
  const job = await readTargetJob(account, id);
  const cv = await readCv(account, id);
  const listing = await readListingSnapshot(account, id);
  if (!job || !listing) notFound();
  if (!cv) redirect(`/preparations/${id}/setup`);
  const confirmations = await readKeywordConfirmations(account, id, job.version);
  const edits = buildTailoredEdits(job.description, cv.evidence, confirmations);
  const saved = await saveTailoredDraft(account, id, job.version, cv.version, edits);
  if (!saved) {
    redirect(`/preparations/${id}/tailored-cv?changed=1`);
  }
  redirect(`/preparations/${id}/tailored-cv`);
}
