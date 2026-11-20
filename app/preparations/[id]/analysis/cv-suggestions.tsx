"use client";

import { useState } from "react";
import type { Requirement } from "../../../../lib/cv-fit";
import type { CvEvidence } from "../../../../lib/cv-text";

export function CvSuggestions({ items, evidence }: { items: Requirement[]; evidence: CvEvidence[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const gaps = items.filter((item) => !item.evidence || item.partial);
  return (
    <section className="fields" aria-labelledby="suggestions-heading">
      <h2 id="suggestions-heading">CV improvements</h2>
      <button type="button" className="button" aria-expanded={open} aria-controls="cv-suggestions"
        onClick={() => setOpen(!open)}>
        {open ? "Hide CV improvements" : "Show CV improvements"}
      </button>
      <div id="cv-suggestions" hidden={!open}>
        {!gaps.length && <p>All reviewed requirements have supporting evidence.</p>}
        {gaps.map((item) => {
          const line = selected[item.id] ?? Number(item.evidence);
          const source = evidence.find((entry) => entry.line === line);
          return (
            <fieldset className="fields" key={item.id}>
              <legend>{item.title}</legend>
              <label>
                Related CV evidence for {item.title}
                <select value={line || ""} onChange={(event) => {
                  const value = Number(event.target.value);
                  setSelected((previous) => ({ ...previous, [item.id]: value }));
                }}>
                  <option value="">No related evidence selected</option>
                  {evidence.map((entry) => (
                    <option key={entry.line} value={entry.line}>
                      {entry.section} · Line {entry.line} · {entry.excerpt.slice(0, 140)}
                    </option>
                  ))}
                </select>
              </label>
              {source ? (
                <>
                  <p>Move this existing line earlier in {source.section} if it helps explain your fit for this requirement. Keep the original project or role context.</p>
                  <p className="saved-description"><strong>{source.section} · Line {source.line}</strong><br />{source.excerpt}</p>
                </>
              ) : <p>If you have an example that demonstrates this requirement, add the specific work you did and its outcome. If you are still learning it, leave the skill off the CV and use the gap to guide practice.</p>}
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}
