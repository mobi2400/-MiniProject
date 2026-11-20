import Link from "next/link";
import { analyzeKeywords } from "../../../../lib/ats-keywords";
import type { CvEvidence } from "../../../../lib/cv-text";
import { readKeywordConfirmations } from "../../../../lib/keyword-confirmations";
import { KeywordForm } from "./keyword-form";

export function KeywordCoverage({ account, id, jobVersion, cvVersion, description, evidence }: {
  account: string; id: string; jobVersion: number; cvVersion: number; description: string; evidence: CvEvidence[];
}) {
  const { keywords, covered, estimate } = analyzeKeywords(description, evidence);
  const confirmations = new Map(readKeywordConfirmations(account, id, jobVersion).map((entry) => [entry.term, entry]));
  return (
    <section aria-labelledby="keyword-heading" className="role-progress">
      <h2 id="keyword-heading">ATS keyword coverage</h2>
      <p>This estimate measures overlap for recognized terms. Employers may evaluate applications using different criteria.</p>
      {estimate === null ? <p>No supported keywords were detected in this posting.</p> : (
        <>
          <p><strong>Keyword coverage estimate: {estimate}%</strong> · {covered} of {keywords.length} detected terms</p>
          <ul>{keywords.map(({ term, source }) => {
            const saved = confirmations.get(term);
            return (
            <li key={term}>
              <strong>{term}</strong> · {source ? "Present" : "Missing"}
              {source && <p className="saved-description">{source.section} · Line {source.line}: {source.excerpt}</p>}
              {!source && <>
                {saved?.status === "have" && <p>Confirmed by you: {saved.detail}</p>}
                {saved && saved.status !== "have" && <p>Practice gap · <Link href={`/preparations/${id}/offer`}>Check practice coverage</Link></p>}
                <details>
                  <summary>{saved ? `Change status for ${term}` : `Confirm status for ${term}`}</summary>
                  <KeywordForm id={id} jobVersion={jobVersion} cvVersion={cvVersion} term={term} saved={saved} />
                </details>
              </>}
            </li>
            );
          })}</ul>
        </>
      )}
    </section>
  );
}
