"use client";

import { useState, useTransition } from "react";
import { mergeListings, type BoardResult } from "../../lib/job-sources";
import { prepareForListing, searchSavedJobs } from "./actions";

export function SearchResults() {
  const [results, setResults] = useState<BoardResult[]>([]);
  const [source, setSource] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [pending, run] = useTransition();
  const listings = mergeListings(results).filter((job) =>
    (!source || job.sources.some(({ id }) => id === source)) &&
    job.location.toLowerCase().includes(location.trim().toLowerCase()));

  function search(retry?: string) {
    setError("");
    run(async () => {
      try {
        const response = await searchSavedJobs(retry);
        if (response.error) setError(response.error);
        if (response.results) {
          const fresh = response.results;
          if (retry) setResults((previous) => previous.map((entry) => entry.board.id === retry ? fresh[0] : entry));
          else {
            setResults(fresh);
            setSource("");
            setLocation("");
          }
        }
      } catch {
        setError("Job search could not run. Try again.");
      }
    });
  }

  return (
    <section className="fields" aria-labelledby="search-listings">
      <h2 id="search-listings">Job listings</h2>
      <button type="button" className="button" disabled={pending} onClick={() => search()}>
        {pending ? "Searching…" : "Search saved titles"}
      </button>
      {error && <p role="alert">{error}</p>}
      {results.length > 0 && <>
        <ul aria-label="Board status">{results.map((entry) => (
          <li key={entry.board.id}>
            <strong>{entry.board.name}</strong>{" "}
            {"error" in entry ? <>
              {entry.error} <button type="button" className="text-button" disabled={pending}
                onClick={() => search(entry.board.id)}>Retry {entry.board.name}</button>
            </> : <>· {entry.jobs.length} matches · Checked {new Date(entry.checkedAt).toLocaleString()}</>}
          </li>
        ))}</ul>
        <label>Source <select value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="">All boards</option>
          {results.map(({ board }) => <option key={board.id} value={board.id}>{board.name}</option>)}
        </select></label>
        <label>Filter by location <input value={location} onChange={(event) => setLocation(event.target.value)} /></label>
        <p role="status">{listings.length} listings</p>
        <ul>{listings.map((job) => <li key={job.url}>
          <a href={job.url}>{job.title}</a>
          <p>{job.company} · {job.location}</p>
          <p>Sources: {job.sources.map(({ name }) => name).join(", ")}</p>
          <form action={async () => {
            const result = await prepareForListing(job.sources[0].id, job.listingId);
            if (result?.error) setError(result.error);
          }}>
            <button type="submit" className="text-button" aria-label={`Prepare for ${job.title}`}>Prepare for this job</button>
          </form>
        </li>)}</ul>
      </>}
    </section>
  );
}
