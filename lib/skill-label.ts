import { skillCatalog } from "./ats-keywords";

const fillerPattern =
  /^(?:hands[- ]on experience (?:with|in)|experience (?:with|in)|proficiency (?:in|with)|knowledge of|familiarity with|working knowledge of|understanding of|expertise in|ability to|strong|excellent)\s+/iu;

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

// Short name for a requirement: a known skill from the catalog if one appears in it,
// otherwise the requirement with filler words and punctuation removed.
export function skillLabel(requirement: string): string {
  const text = requirement.replace(/\s+/gu, " ").trim();
  // The skill that appears first in the sentence is usually the main one; on a tie, prefer the longer name.
  let best: { term: string; index: number } | undefined;
  for (const term of skillCatalog) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegExp(term)}(?![\\p{L}\\p{N}_])`, "iu");
    const match = pattern.exec(text);
    if (!match) continue;
    if (!best || match.index < best.index || (match.index === best.index && term.length > best.term.length)) {
      best = { term, index: match.index };
    }
  }
  if (best) return best.term;
  const trimmed = text.replace(fillerPattern, "").replace(/[.;:,]+$/u, "");
  if (trimmed.length <= 60) return trimmed;
  return `${trimmed.slice(0, 60).replace(/\s+\S*$/u, "")}…`;
}
