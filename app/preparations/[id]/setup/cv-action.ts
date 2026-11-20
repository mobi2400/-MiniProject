"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { saveCv } from "../../../../lib/cv";
import { cvByteLimit, extractTextEvidence } from "../../../../lib/cv-text";
import { readTargetJob } from "../../../../lib/preparations";
import { requireAccount } from "../../../../lib/session";

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
