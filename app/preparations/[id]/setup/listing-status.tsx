"use client";

import { useActionState } from "react";
import { refreshListing } from "./listing-action";

export function ListingStatus({ id, status }: { id: string; status: "open" | "closed" | null }) {
  const [error, action, pending] = useActionState(refreshListing.bind(null, id), "");
  return (
    <form className="fields" action={action}>
      <p role="status">{status === "closed" ? "Posting closed. Your saved preparation is still available."
        : status === "open" ? "Posting was open at the last check." : "Posting status has not been checked."}</p>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className="text-button" disabled={pending}>{pending ? "Checking…" : "Check posting status"}</button>
    </form>
  );
}
