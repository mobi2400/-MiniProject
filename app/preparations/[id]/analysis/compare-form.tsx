"use client";

import { useState, useTransition } from "react";
import type { Requirement } from "../../../../lib/cv-fit";
import type { CvEvidence } from "../../../../lib/cv-text";
import { copy } from "../../../../lib/copy";
import { CvSuggestions } from "./cv-suggestions";

type Report = { items: Requirement[]; score: number | null };

const firstRequirement: Requirement = { id: 1, title: "", required: true, evidence: "", partial: false };

export function CompareForm({ evidence, report, save, suggest }: {
  evidence: CvEvidence[];
  report?: Report;
  save: (items: Requirement[]) => Promise<{ error?: string; report?: Report }>;
  suggest?: () => Promise<{ error?: string; items?: Requirement[] }>;
}) {
  const [items, setItems] = useState(report?.items ?? [firstRequirement]);
  const [result, setResult] = useState(report);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [suggesting, startSuggestion] = useTransition();
  const busy = pending || suggesting;

  function update(id: number, patch: Partial<Requirement>) {
    setItems(items.map((item) => item.id === id ? { ...item, ...patch } : item));
    setResult(undefined);
  }

  // Divide items into 3 plain language groups when result exists
  const supportedItems = result?.items.filter((item) => item.evidence && !item.partial) ?? [];
  const partlySupportedItems = result?.items.filter((item) => item.evidence && item.partial) ?? [];
  const missingItems = result?.items.filter((item) => !item.evidence) ?? [];

  return (
    <>
      {suggest && (
        <section className="fields" aria-label="AI comparison">
          <p>Generate a draft from your job description and CV excerpts sent to OpenAI. Review the suggested requirements and evidence before saving.</p>
          <button type="button" className="button" disabled={busy} onClick={() => {
            setError("");
            startSuggestion(async () => {
              try {
                const response = await suggest();
                if (response.error) setError(response.error);
                if (response.items) {
                  setItems(response.items);
                  setResult(undefined);
                }
              } catch {
                setError("AI comparison could not be generated. Try again or compare the CV manually.");
              }
            });
          }}>{suggesting ? "Generating draft…" : "Draft comparison with OpenAI"}</button>
        </section>
      )}
      <form className="fields" onSubmit={(event) => {
        event.preventDefault();
        setError("");
        startTransition(async () => {
          try {
            const response = await save(items);
            if (response.error) setError(response.error);
            if (response.report) setResult(response.report);
          } catch {
            setError("The comparison could not be saved. Try again.");
          }
        });
      }}>
        <p>Add requirements from the job description and choose supporting lines from your CV. This estimate reflects the evidence you select.</p>
        
        {items.map((item, index) => (
          <fieldset className="fields" key={item.id} disabled={busy}>
            <legend>Requirement {index + 1}</legend>
            <label>Requirement <input required pattern=".*\S.*" maxLength={300} value={item.title}
              onChange={(event) => update(item.id, { title: event.target.value })} /></label>
            <label>Priority <select value={item.required ? "required" : "preferred"}
              onChange={(event) => update(item.id, { required: event.target.value === "required" })}>
              <option value="required">Required</option>
              <option value="preferred">Preferred</option>
            </select></label>
            <label>Experience from your CV <select value={item.evidence}
              onChange={(event) => update(item.id, { evidence: event.target.value })}>
              <option value="">No supporting evidence</option>
              {evidence.map((entry) => (
                <option key={entry.line} value={entry.line}>
                  {entry.section} · Line {entry.line} · {entry.excerpt.slice(0, 140)}
                </option>
              ))}
            </select></label>
            {item.evidence && <label className="check-label"><input type="checkbox" checked={item.partial}
              onChange={(event) => update(item.id, { partial: event.target.checked })} /> This line only partially supports the requirement</label>}
            {items.length > 1 && <button type="button" className="text-button" onClick={() => {
              setItems(items.filter(({ id }) => id !== item.id));
              setResult(undefined);
            }}>Remove requirement {index + 1}</button>}
          </fieldset>
        ))}

        <details style={{ marginBlock: "0.5rem" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Add a requirement not listed</summary>
          {items.length < 30 && (
            <button type="button" className="text-button" style={{ marginTop: "0.5rem" }} disabled={busy} onClick={() => {
              setItems([...items, { ...firstRequirement, id: Math.max(...items.map(({ id }) => id)) + 1 }]);
              setResult(undefined);
            }}>+ Add another requirement</button>
          )}
        </details>

        {error && <p role="alert">{error}</p>}
        <button className="button" disabled={busy}>{pending ? "Saving comparison…" : "Compare CV"}</button>
      </form>

      {result && (
        <section aria-label="Comparison result" style={{ marginTop: "2rem" }}>
          <div style={{ background: "#f2effb", padding: "1.25rem", borderRadius: "0.75rem", marginBottom: "1.5rem" }}>
            <h2 role="status" style={{ fontSize: "1.4rem" }}>How well your CV matches this job: {result.score}%</h2>
            <p style={{ margin: "0.5rem 0 0", color: "var(--muted)" }}>{copy.fitScoreExplanation}</p>
          </div>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            {supportedItems.length > 0 && (
              <div>
                <h3 style={{ color: "#2b7a3d" }}>{copy.supportsRequirement} ({supportedItems.length})</h3>
                <ul>{supportedItems.map((item) => {
                  const source = evidence.find(({ line }) => String(line) === item.evidence);
                  return (
                    <li key={item.id} style={{ marginBlock: "0.5rem" }}>
                      <strong>{item.title}</strong> · {item.required ? "Required" : "Preferred"}
                      {source && <p style={{ margin: "0.2rem 0 0", color: "var(--muted)" }}>{source.section} · Line {source.line}: {source.excerpt}</p>}
                    </li>
                  );
                })}</ul>
              </div>
            )}

            {partlySupportedItems.length > 0 && (
              <div>
                <h3 style={{ color: "#b26b00" }}>{copy.partlySupportsRequirement} ({partlySupportedItems.length})</h3>
                <ul>{partlySupportedItems.map((item) => {
                  const source = evidence.find(({ line }) => String(line) === item.evidence);
                  return (
                    <li key={item.id} style={{ marginBlock: "0.5rem" }}>
                      <strong>{item.title}</strong> · {item.required ? "Required" : "Preferred"}
                      {source && <p style={{ margin: "0.2rem 0 0", color: "var(--muted)" }}>{source.section} · Line {source.line}: {source.excerpt}</p>}
                    </li>
                  );
                })}</ul>
              </div>
            )}

            {missingItems.length > 0 && (
              <div>
                <h3 style={{ color: "#a32a2a" }}>{copy.notInCv} ({missingItems.length})</h3>
                <ul>{missingItems.map((item) => (
                  <li key={item.id} style={{ marginBlock: "0.5rem" }}>
                    <strong>{item.title}</strong> · {item.required ? "Required" : "Preferred"}
                    <p style={{ margin: "0.2rem 0 0", color: "var(--muted)" }}>No supporting experience selected from your CV.</p>
                  </li>
                ))}</ul>
              </div>
            )}
          </div>

          <CvSuggestions items={result.items} evidence={evidence} />
        </section>
      )}
    </>
  );
}
