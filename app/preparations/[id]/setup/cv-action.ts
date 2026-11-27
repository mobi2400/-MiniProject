"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { readCv, saveCv, saveCvCorrection } from "../../../../lib/cv";
import { isCvSection } from "../../../../lib/cv-text";
import { extractCvText, extractEvidenceFromNormalizedText } from "../../../../lib/cv-extract";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";

export async function correctCvSection(preparationId: string, version: number, line: number, _: string, data: FormData) {
  const accountId = await requireAccount();
  const job = await readTargetJob(accountId, preparationId);
  if (!job) notFound();
  const cv = await readCv(accountId, preparationId);
  const stale = "The CV changed. Reload before correcting the evidence.";
  if (cv?.version !== version) return stale;
  const section = data.get("section");
  const entry = cv.evidence.find((item) => item.line === line);
  if (typeof section !== "string" || !isCvSection(section) || !entry) return "Choose a valid evidence section.";
  if (entry.section === section) return "This line already belongs to that section.";
  const evidence = cv.evidence.map((item) => item.line === line ? { ...item, section } : item);
  const saved = await saveCvCorrection(accountId, preparationId, version, evidence);
  if (!saved) return stale;
  revalidatePath(`/preparations/${preparationId}/setup`);
  revalidatePath(`/preparations/${preparationId}/analysis`);
  return "";
}

export async function uploadCv(preparationId: string, _: string, data: FormData) {
  const accountId = await requireAccount();
  const job = await readTargetJob(accountId, preparationId);
  if (!job) notFound();
  const file = data.get("cv");
  if (!(file instanceof File) || file.name.length > 255 || !file.size) {
    return "Choose a CV (.txt, .pdf, or .docx) up to 5 MB.";
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extracted = await extractCvText(bytes, file.name);
  if ("error" in extracted) {
    return extracted.error;
  }

  const evidence = extractEvidenceFromNormalizedText(extracted.text);
  if (!evidence.length) {
    return "Add a heading such as Skills or Experience above the relevant text, then try again.";
  }

  const saved = await saveCv(accountId, preparationId, file.name, bytes, evidence, extracted.format);
  if (!saved) notFound();
  revalidatePath(`/preparations/${preparationId}/setup`);
  return "";
}
