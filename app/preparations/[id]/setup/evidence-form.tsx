"use client";

import { useActionState } from "react";
import { cvSections } from "../../../../lib/cv-text";
import { correctCvSection } from "./cv-action";

export function EvidenceForm({ preparationId, version, line, section }: {
  preparationId: string;
  version: number;
  line: number;
  section: string;
}) {
  const [error, action, pending] = useActionState(correctCvSection.bind(null, preparationId, version, line), "");
  return (
    <details>
      <summary>Correct section for line {line}</summary>
      <form action={action} className="fields">
        <label>Section for line {line}
          <select name="section" defaultValue={section}>
            {cvSections.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" className="button" disabled={pending}>{pending ? "Saving…" : "Save correction"}</button>
      </form>
    </details>
  );
}
