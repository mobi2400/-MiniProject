"use client";

import { useActionState } from "react";
import { uploadCv } from "./cv-action";

export function CvForm({ preparationId }: { preparationId: string }) {
  const [error, action, pending] = useActionState(uploadCv.bind(null, preparationId), "");
  return (
    <form action={action} className="fields">
      <label>CV file <input type="file" name="cv" accept=".txt,text/plain" required /></label>
      <p>Upload a UTF-8 text CV up to 128 KB. Use headings such as Skills, Experience, or Projects.</p>
      {error && <p role="alert">{error}</p>}
      <button className="button" disabled={pending}>{pending ? "Reading CV…" : "Upload CV"}</button>
    </form>
  );
}
