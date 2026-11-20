import { analyzeKeywords } from "../../../../lib/ats-keywords";
import type { CvEvidence } from "../../../../lib/cv-text";

export function KeywordCoverage({ description, evidence }: { description: string; evidence: CvEvidence[] }) {
  const { keywords, covered, estimate } = analyzeKeywords(description, evidence);
  return (
    <section aria-labelledby="keyword-heading" className="role-progress">
      <h2 id="keyword-heading">ATS keyword coverage</h2>
      <p>This estimate measures overlap for recognized terms. Employers may evaluate applications using different criteria.</p>
      {estimate === null ? <p>No supported keywords were detected in this posting.</p> : (
        <>
          <p><strong>Keyword coverage estimate: {estimate}%</strong> · {covered} of {keywords.length} detected terms</p>
          <ul>{keywords.map(({ term, source }) => (
            <li key={term}>
              <strong>{term}</strong> · {source ? "Present" : "Missing"}
              {source && <p className="saved-description">{source.section} · Line {source.line}: {source.excerpt}</p>}
            </li>
          ))}</ul>
        </>
      )}
    </section>
  );
}
