"use client";

import { useActionState, useState } from "react";
import { submitTargetJob } from "./actions";

export function JobForm({ id }: { id: string }) {
  const [error, action, pending] = useActionState(submitTargetJob.bind(null, id), "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  return (
    <form className="fields" action={action}>
      <label>
        Role title
        <span style={{ fontSize: "0.875rem", color: "var(--muted)", fontWeight: 400 }}>Example: Junior Data Analyst, Software Engineer Intern</span>
        <input name="title" required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Job description
        <span style={{ fontSize: "0.875rem", color: "var(--muted)", fontWeight: 400 }}>Paste the full job description. Include the requirements section.</span>
        <textarea name="description" required maxLength={20000} rows={8} value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="button" disabled={pending}>{pending ? "Saving…" : "Save job and continue"}</button>
    </form>
  );
}
