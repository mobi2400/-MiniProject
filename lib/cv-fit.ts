export type FitMatch = "demonstrated" | "partial" | "missing";

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
