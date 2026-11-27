import { extractText, getDocumentProxy } from "unpdf";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require("mammoth");
import { cvSections, type CvEvidence } from "./cv-text";

export type CvFormat = "txt" | "pdf" | "docx";

export const maxUploadBytes = 5 * 1024 * 1024; // 5 MB
export const maxExtractedTextBytes = 128 * 1024; // 128 KB
export const maxPdfPages = 10;
export const extractionTimeoutMs = 10000; // 10 seconds

function isZipWithWordDoc(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // Check ZIP signature PK\x03\x04
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    return false;
  }
  // Search for "word/document.xml" string in the byte array
  const target = new TextEncoder().encode("word/document.xml");
  let found = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === target[found]) {
      found++;
      if (found === target.length) return true;
    } else {
      found = bytes[i] === target[0] ? 1 : 0;
    }
  }
  return false;
}

function detectMagicFormat(bytes: Uint8Array): CvFormat | "other" {
  // PDF: starts with %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return "pdf";
  }

  // DOCX: ZIP archive containing word/document.xml
  if (isZipWithWordDoc(bytes)) {
    return "docx";
  }

  // TXT: Valid UTF-8 with no control characters (except \t, \r, \n)
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text)) {
      return "txt";
    }
  } catch {
    // not valid utf-8
  }

  return "other";
}

function normalizeLines(rawText: string): string[] {
  // Known section names in lowercase
  const knownHeadings = cvSections.map((s) => s.toLowerCase());

  const lines = rawText.split(/\r\n|\n|\r/u);
  const normalized: string[] = [];

  for (const line of lines) {
    // Collapse runs of whitespace
    const collapsed = line.replace(/[ \t]+/g, " ").trim();
    if (!collapsed) continue;

    // Check if heading is glued to text: e.g. "SkillsPython, SQL" or "Skills: Python, SQL"
    let handled = false;
    for (const heading of knownHeadings) {
      const lower = collapsed.toLowerCase();
      if (lower.startsWith(heading) && lower.length > heading.length) {
        const nextChar = lower[heading.length];
        if (nextChar === ":" || nextChar === " " || nextChar === "\t" || /[a-z0-9]/i.test(nextChar)) {
          let remainder = collapsed.slice(heading.length);
          if (remainder.startsWith(":")) {
            remainder = remainder.slice(1);
          }
          remainder = remainder.trim();
          normalized.push(collapsed.slice(0, heading.length));
          if (remainder) {
            normalized.push(remainder);
          }
          handled = true;
          break;
        }
      }
    }
    if (!handled) {
      normalized.push(collapsed);
    }
  }

  return normalized;
}

export async function extractCvText(
  bytes: Uint8Array,
  filename: string,
): Promise<{ format: CvFormat; text: string } | { error: string }> {
  if (!bytes.length) {
    return { error: "The uploaded file is empty." };
  }
  if (bytes.length > maxUploadBytes) {
    return { error: "Please upload a CV up to 5 MB." };
  }

  const extMatch = /\.([a-zA-Z0-9]+)$/u.exec(filename);
  const ext = extMatch ? extMatch[1].toLowerCase() : "";

  if (ext !== "pdf" && ext !== "docx" && ext !== "txt") {
    return { error: "That file type isn't supported. Upload a PDF, Word file, or .txt file." };
  }

  const detected = detectMagicFormat(bytes);

  if (ext === "pdf" && detected !== "pdf") {
    return { error: "This file is named .pdf but is not a PDF." };
  }
  if (ext === "docx" && detected !== "docx") {
    return { error: "This file is named .docx but is not a Word document." };
  }
  if (ext === "txt" && detected !== "txt") {
    return { error: "This file is named .txt but is not a valid plain text file." };
  }

  const format: CvFormat = detected as CvFormat;

  const extractPromise = (async () => {
    try {
      if (format === "txt") {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        return { success: true, text };
      }

      if (format === "pdf") {
        // Inspect page count
        let pdf;
        try {
          pdf = await getDocumentProxy(bytes);
        } catch {
          return {
            success: false,
            error: "We could not read this file. Try exporting it again or upload a .txt version.",
          };
        }

        if (pdf.numPages > maxPdfPages) {
          return { success: false, error: "Please upload a CV of 10 pages or fewer." };
        }

        const { text } = await extractText(pdf, { mergePages: true });
        return { success: true, text };
      }

      if (format === "docx") {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
        return { success: true, text: result.value };
      }

      return {
        success: false,
        error: "We could not read this file. Try exporting it again or upload a .txt version.",
      };
    } catch {
      return {
        success: false,
        error: "We could not read this file. Try exporting it again or upload a .txt version.",
      };
    }
  })();

  const timeoutPromise = new Promise<{ success: false; error: string }>((resolve) =>
    setTimeout(
      () =>
        resolve({
          success: false,
          error: "Text extraction timed out. Try exporting it again or upload a .txt version.",
        }),
      extractionTimeoutMs,
    ),
  );

  const res = (await Promise.race([extractPromise, timeoutPromise])) as
    | { success: true; text: string }
    | { success: false; error: string };
  if (!res.success) {
    return { error: res.error };
  }

  const normalizedLines = normalizeLines(res.text);
  const normalizedText = normalizedLines.join("\n");

  const byteLength = Buffer.byteLength(normalizedText, "utf-8");
  if (byteLength > maxExtractedTextBytes) {
    return { error: "The extracted text exceeds the 128 KB limit. Please upload a shorter CV." };
  }

  return { format, text: normalizedText };
}

export function extractEvidenceFromNormalizedText(text: string): CvEvidence[] {
  const sectionMapping: Record<string, string> = {
    skills: "Skills",
    "technical skills": "Skills",
    experience: "Experience",
    "work experience": "Experience",
    "professional experience": "Experience",
    projects: "Projects",
    education: "Education",
    certifications: "Certifications",
  };

  let currentSection: string | undefined;
  const evidence: CvEvidence[] = [];

  for (const [index, raw] of text.split("\n").entries()) {
    const excerpt = raw.trim();
    const heading = excerpt.toLowerCase().replace(/:$/u, "").trim();
    if (heading in sectionMapping) {
      currentSection = sectionMapping[heading];
    } else if (currentSection && excerpt) {
      evidence.push({ section: currentSection, excerpt, line: index + 1 });
    }
  }

  return evidence;
}
