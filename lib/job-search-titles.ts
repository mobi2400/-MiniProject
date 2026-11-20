import type { CvEvidence } from "./cv-text";

const roles = [
  { title: "Reporting Analyst", signals: /\b(reporting|dashboards?)\b/iu },
  { title: "Data Analyst", signals: /\b(sql|data analysis|data visualization)\b/iu },
  { title: "Software Developer", signals: /\b(javascript|typescript|software development)\b/iu },
  { title: "Customer Support Specialist", signals: /\b(customer support|help desk|service desk)\b/iu },
];

export function suggestJobTitles(evidence: CvEvidence[]) {
  return roles.flatMap(({ title, signals }) => {
    const source = evidence.find(({ section, excerpt }) =>
      ["Skills", "Experience", "Projects"].includes(section) && signals.test(excerpt));
    return source ? [{ title, source }] : [];
  });
}

export function parseJobTitles(text: string) {
  const titles = new Map<string, string>();
  for (const raw of text.split(/\r?\n/u)) {
    const title = raw.trim().replace(/\s+/gu, " ");
    if (title.length > 100) return null;
    const key = title.toLowerCase();
    if (title && !titles.has(key)) titles.set(key, title);
  }
  return titles.size <= 10 ? [...titles.values()] : null;
}
