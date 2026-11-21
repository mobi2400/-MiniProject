"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { analyzeKeywords } from "../../../../lib/ats-keywords";
import { readCv } from "../../../../lib/cv";
import { saveKeywordConfirmation } from "../../../../lib/keyword-confirmations";
import { readListingSnapshot, readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";

export async function confirmKeyword(id: string, jobVersion: number, cvVersion: number, term: string, _: string, form: FormData) {
  const account = await requireAccount();
  const job = await readTargetJob(account, id);
  const listing = await readListingSnapshot(account, id);
  if (!job || !listing) notFound();
  const cv = await readCv(account, id);
  const stale = "Your CV or target job changed. Reload this page before saving.";
  if (job.version !== jobVersion || cv?.version !== cvVersion) return stale;
  const keyword = analyzeKeywords(job.description, cv.evidence).keywords.find((item) => item.term === term);
  if (!keyword || keyword.source) return "This keyword is outside the current list of missing terms.";
  const status = form.get("status");
  if (status !== "have" && status !== "learning" && status !== "missing") return "Choose how this term applies to you.";
  const raw = form.get("detail");
  const detail = status === "have" && typeof raw === "string" ? raw.trim() : "";
  if (status === "have" && (!detail || detail.length > 500)) return "Describe where you used this skill in up to 500 characters.";
  const saved = await saveKeywordConfirmation(account, id, jobVersion, cvVersion, { term, status, detail });
  if (!saved) return stale;
  revalidatePath(`/preparations/${id}/analysis`);
  return "";
}
