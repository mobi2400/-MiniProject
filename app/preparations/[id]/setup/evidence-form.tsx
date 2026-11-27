"use client";

import { useActionState, useState } from "react";
import { cvSections } from "../../../../lib/cv-text";
import { correctCvSection } from "./cv-action";

export function EvidenceForm({ preparationId, version, line, section }: {
  preparationId: string;
  version: number;
  line: number;
  section: string;
}) {
  const [error, action, pending] = useActionState(correctCvSection.bind(null, preparationId, version, line), "");
  const [editing, setEditing] = useState(false);

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {!editing ? (
        <button
          type="button"
          className="text-button"
          onClick={() => setEditing(true)}
          style={{ fontSize: "0.875rem" }}
        >
          Edit section
        </button>
      ) : (
        <form
          action={async (formData) => {
            await action(formData);
            setEditing(false);
          }}
          className="fields"
          style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#f8f7fd", borderRadius: "0.5rem" }}
        >
          <label>
            Section
            <select name="section" defaultValue={section}>
              {cvSections.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          {error && <p role="alert">{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button type="submit" className="button" disabled={pending}>
              {pending ? "Saving…" : "Save section"}
            </button>
            <button type="button" className="text-button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
