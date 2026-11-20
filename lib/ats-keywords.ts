import type { CvEvidence } from "./cv-text";

const catalog = [
  "SQL", "SQL joins", "Python", "Excel", "Power BI", "Tableau",
  "data analysis", "data visualization", "reporting", "dashboards",
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Java", "C++", "C#",
  "Git", "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud",
  "machine learning", "prompt engineering", "REST APIs", "automated testing",
  "project management", "stakeholder management", "customer support", "technical writing",
];

function normalize(text: string) {
  return text.normalize("NFKC").toLowerCase().replace(/\s+/gu, " ");
}

export function analyzeKeywords(description: string, evidence: CvEvidence[]) {
  const posting = normalize(description);
  const cv = evidence.map((source) => ({ source, text: normalize(source.excerpt) }));
  const keywords = catalog.flatMap((term) => {
    const escaped = normalize(term).replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "u");
    if (!pattern.test(posting)) return [];
    return [{ term, source: cv.find(({ text }) => pattern.test(text))?.source ?? null }];
  });
  const covered = keywords.filter(({ source }) => source !== null).length;
  return { keywords, covered, estimate: keywords.length ? Math.round(100 * covered / keywords.length) : null };
}
