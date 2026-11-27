"use client";

import { useActionState } from "react";
import { uploadCv } from "./cv-action";

export function CvForm({ preparationId }: { preparationId: string }) {
  const [error, action, pending] = useActionState(uploadCv.bind(null, preparationId), "");
  return (
    <form action={action} className="fields">
      <label>CV file <input type="file" name="cv" accept=".txt,.pdf,.docx" required /></label>
      <p>Upload your CV in PDF, Word (.docx), or plain text (.txt) format up to 5 MB. Include headings such as Skills or Experience.</p>
      {error && <p role="alert">{error}</p>}
      <button className="button" disabled={pending}>{pending ? "Reading CV…" : "Upload CV"}</button>
    </form>
  );
}
