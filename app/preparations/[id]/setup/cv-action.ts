"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { readCv, saveCv, saveCvCorrection } from "../../../../lib/cv";
import { cvByteLimit, extractTextEvidence, isCvSection } from "../../../../lib/cv-text";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";

export async function correctCvSection(preparationId: string, version: number, line: number, _: string, data: FormData) {
  const accountId = await requireAccount();
  if (!readTargetJob(accountId, preparationId)) notFound();
  const cv = readCv(accountId, preparationId);
  const stale = "The CV changed. Reload before correcting the evidence.";
  if (cv?.version !== version) return stale;
  const section = data.get("section");
  const entry = cv.evidence.find((item) => item.line === line);
  if (typeof section !== "string" || !isCvSection(section) || !entry) return "Choose a valid evidence section.";
  if (entry.section === section) return "This line already belongs to that section.";
  const evidence = cv.evidence.map((item) => item.line === line ? { ...item, section } : item);
  if (!saveCvCorrection(accountId, preparationId, version, evidence)) return stale;
  revalidatePath(`/preparations/${preparationId}/setup`);
  revalidatePath(`/preparations/${preparationId}/analysis`);
  return "";
}

export async function uploadCv(preparationId: string, _: string, data: FormData) {
  const accountId = await requireAccount();
  if (!readTargetJob(accountId, preparationId)) notFound();
  const file = data.get("cv");
  if (!(file instanceof File) || !/\.txt$/iu.test(file.name) || file.name.length > 255 || !file.size || file.size > cvByteLimit) {
    return "Choose a plain-text CV (.txt) up to 128 KB.";
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let evidence;
  try {
    evidence = extractTextEvidence(bytes);
  } catch {
    return "This file could not be read as UTF-8 text. Export it as UTF-8 and try again.";
  }
  if (!evidence.length) return "Add a heading such as Skills or Experience above the relevant text, then try again.";
  if (!saveCv(accountId, preparationId, file.name, bytes, evidence)) notFound();
  revalidatePath(`/preparations/${preparationId}/setup`);
  return "";
}
