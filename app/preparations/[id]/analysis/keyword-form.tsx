"use client";

import { useActionState, useState } from "react";
import type { Confirmation } from "../../../../lib/keyword-confirmations";
import { confirmKeyword } from "./keyword-action";

export function KeywordForm({ id, jobVersion, cvVersion, term, saved }: {
  id: string; jobVersion: number; cvVersion: number; term: string; saved?: Confirmation;
}) {
  const [status, setStatus] = useState(saved?.status ?? "");
  const [detail, setDetail] = useState(saved?.detail ?? "");
  const [error, action, pending] = useActionState(confirmKeyword.bind(null, id, jobVersion, cvVersion, term), "");
  return (
    <form className="fields" action={action}>
      <label>How does {term} apply to you?
        <select name="status" required value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
          <option value="">Choose a status</option>
          <option value="have">I have this skill</option>
          <option value="learning">I’m learning this</option>
          <option value="missing">I don’t have this skill</option>
        </select>
      </label>
      {status === "have" && <label>Where did you use {term}?
        <textarea name="detail" required maxLength={500} rows={3} value={detail} onChange={(event) => setDetail(event.target.value)} />
      </label>}
      {error && <p role="alert">{error}</p>}
      <button className="button" disabled={pending}>{pending ? "Saving…" : `Save status for ${term}`}</button>
    </form>
  );
}
