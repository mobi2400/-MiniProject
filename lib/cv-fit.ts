export type FitMatch = "demonstrated" | "partial" | "missing";

export type Requirement = { id: number; title: string; required: boolean; evidence: string; partial: boolean };

export function validateRequirements(value: unknown, evidenceLines: number[]): Requirement[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 30) return null;
  const allowedLines = new Set(evidenceLines.map(String));
  const items: Requirement[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const { title, required, evidence, partial } = entry;
    if (typeof title !== "string" || !title.trim() || title.length > 300 ||
      typeof required !== "boolean" || typeof partial !== "boolean" ||
      typeof evidence !== "string" || (evidence && !allowedLines.has(evidence))) return null;
    items.push({ id: items.length + 1, title: title.trim(), required, evidence, partial: Boolean(evidence && partial) });
  }
  return items;
}

export function calculateCvFit(items: { match: FitMatch; required: boolean }[]) {
  const credits = { demonstrated: 1, partial: 0.5, missing: 0 };
  let points = 0;
  let total = 0;
  for (const item of items) {
    const weight = item.required ? 2 : 1;
    points += weight * credits[item.match];
    total += weight;
  }
  return total ? Math.round(100 * points / total) : null;
}
