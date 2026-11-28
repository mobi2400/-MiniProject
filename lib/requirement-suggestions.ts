const requirementCue =
  /\b(experience|experienced|proficien\w*|knowledge|familiar\w*|skills?|ability|able to|strong|hands[- ]on|expertise|understanding|degree|certification|years?|must|required|requirements?|preferred|nice to have|bonus)\b/iu;

// Returns sentences from the job description that look like requirements.
// Every suggestion is an exact (whitespace-normalized) part of the description, so the
// server's check that a requirement appears in the job description still passes.
export function suggestRequirements(description: string, limit = 20): string[] {
  const seen = new Set<string>();
  const suggestions: string[] = [];
  const pieces = description
    .split(/\r?\n|\[\.\.\.\]|\u2022|\u00b7|\s-\s|(?<=[.!?;])\s+/u);

  for (const piece of pieces) {
    const text = piece
      .replace(/\s+/gu, " ")
      .replace(/^[\s\-*\d.()]+/u, "")
      .replace(/[\s.…]+$/u, "")
      .trim();
    if (text.length < 15 || text.length > 220 || !requirementCue.test(text)) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push(text);
    if (suggestions.length >= limit) break;
  }
  return suggestions;
}
