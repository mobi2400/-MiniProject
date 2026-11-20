"use client";

import { useActionState, useState } from "react";
import type { CvEvidence } from "../../lib/cv-text";
import { parseJobTitles } from "../../lib/job-search-titles";
import { saveSearchTitles } from "./actions";

export function TitleForm({ initialTitles, suggestions }: {
  initialTitles: string[];
  suggestions: { title: string; source: CvEvidence }[];
}) {
  const [text, setText] = useState(initialTitles.join("\n"));
  const [state, action, pending] = useActionState(saveSearchTitles, {});
  const current = parseJobTitles(text);
  return (
    <>
      {suggestions.length > 0 && <section aria-labelledby="suggested-jobs">
        <h2 id="suggested-jobs">Titles suggested from your CV</h2>
        <ul>{suggestions.map(({ title, source }) => {
          const added = current?.some((item) => item.toLowerCase() === title.toLowerCase());
          return <li key={title}>
            <strong>{title}</strong>
            <p>{source.section} · Line {source.line}: {source.excerpt}</p>
            <button className="text-button" type="button" disabled={pending || added || !current || current.length >= 10}
              onClick={() => setText([text.trim(), title].filter(Boolean).join("\n"))}>
              {added ? `${title} added` : `Add ${title}`}
            </button>
          </li>;
        })}</ul>
      </section>}
      <form className="fields" action={action}>
        <label>Search titles
          <textarea name="titles" rows={5} maxLength={3000} value={text}
            onChange={(event) => setText(event.target.value)} />
        </label>
        <p>Enter one title per line. You can edit or remove any suggestion before saving.</p>
        {state.error && <p role="alert">{state.error}</p>}
        {state.titles && current?.join("\n") === state.titles.join("\n") && <p role="status">Search titles saved.</p>}
        <button className="button" disabled={pending}>{pending ? "Saving…" : "Save search titles"}</button>
      </form>
    </>
  );
}
