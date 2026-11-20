"use client";

import { useState } from "react";
import { calculateCvFit } from "../../../../lib/cv-fit";
import type { CvEvidence } from "../../../../lib/cv-text";

type Requirement = { id: number; title: string; required: boolean; evidence: string; partial: boolean };

const firstRequirement: Requirement = { id: 1, title: "", required: true, evidence: "", partial: false };

export function CompareForm({ evidence }: { evidence: CvEvidence[] }) {
  const [items, setItems] = useState([firstRequirement]);
  const [result, setResult] = useState<Requirement[]>();

  function update(id: number, patch: Partial<Requirement>) {
    setItems(items.map((item) => item.id === id ? { ...item, ...patch } : item));
    setResult(undefined);
  }

  const score = result && calculateCvFit(result.map(({ required, evidence, partial }) => ({
    required,
    match: evidence ? partial ? "partial" : "demonstrated" : "missing",
  })));

  return (
    <>
      <form className="fields" onSubmit={(event) => {
        event.preventDefault();
        const requirements = items.map((item) => ({ ...item, title: item.title.trim() }));
        if (requirements.every((item) => item.title)) setResult(requirements);
      }}>
        <p>Add requirements from the job description and choose supporting lines from your CV. This estimate reflects the evidence you select.</p>
        {items.map((item, index) => (
          <fieldset className="fields" key={item.id}>
            <legend>Requirement {index + 1}</legend>
            <label>Requirement <input required pattern=".*\S.*" maxLength={300} value={item.title}
              onChange={(event) => update(item.id, { title: event.target.value })} /></label>
            <label>Priority <select value={item.required ? "required" : "preferred"}
              onChange={(event) => update(item.id, { required: event.target.value === "required" })}>
              <option value="required">Required</option>
              <option value="preferred">Preferred</option>
            </select></label>
            <label>CV evidence <select value={item.evidence}
              onChange={(event) => update(item.id, { evidence: event.target.value })}>
              <option value="">No supporting evidence</option>
              {evidence.map((entry) => (
                <option key={entry.line} value={entry.line}>
                  Line {entry.line} · {entry.excerpt.slice(0, 140)}
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
        {items.length < 30 && <button type="button" className="text-button" onClick={() => {
          setItems([...items, { ...firstRequirement, id: Math.max(...items.map(({ id }) => id)) + 1 }]);
          setResult(undefined);
        }}>Add requirement</button>}
        <button className="button">Compare CV</button>
      </form>
      {result && (
        <section aria-label="Comparison result">
          <h2 role="status">CV-fit estimate {score}%</h2>
          <ul>{result.map((item) => {
            const source = evidence.find(({ line }) => String(line) === item.evidence);
            return (
              <li key={item.id}>
                <strong>{item.title}</strong> · {item.required ? "Required" : "Preferred"}
                {source ? <p>{item.partial ? "Partial match" : "Match"} · Line {source.line}: {source.excerpt}</p> : <p>Gap in the CV · No supporting evidence selected.</p>}
              </li>
            );
          })}</ul>
        </section>
      )}
    </>
  );
}
