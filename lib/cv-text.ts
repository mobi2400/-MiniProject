export const cvByteLimit = 128 * 1024;

const sectionNames = {
  skills: "Skills",
  "technical skills": "Skills",
  experience: "Experience",
  "work experience": "Experience",
  "professional experience": "Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
} as const;

export const cvSections = [...new Set(Object.values(sectionNames))];

export function isCvSection(value: string): boolean {
  return cvSections.some((section) => section === value);
}

export type CvEvidence = { section: string; excerpt: string; line: number };

export function extractTextEvidence(bytes: Uint8Array): CvEvidence[] {
  if (!bytes.length || bytes.length > cvByteLimit) throw new Error("Invalid document size");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text)) throw new Error("Invalid text");
  let section: string | undefined;
  const evidence: CvEvidence[] = [];
  for (const [index, raw] of text.split(/\r\n|\n|\r/u).entries()) {
    const excerpt = raw.trim();
    const heading = excerpt.toLowerCase().replace(/:$/u, "").trim();
    if (Object.hasOwn(sectionNames, heading)) {
      section = sectionNames[heading as keyof typeof sectionNames];
    } else if (section && excerpt) {
      evidence.push({ section, excerpt, line: index + 1 });
    }
  }
  return evidence;
}
