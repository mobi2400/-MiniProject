"use client";

import { useState, useTransition } from "react";
import { mergeListings, type BoardResult } from "../../lib/job-sources";
import type { DiscoveredJob, DiscoveryResponse } from "../../lib/tavily-jobs";
import { discoverWebJobs, prepareForListing, prepareFromDiscoveredJob, searchSavedJobs } from "./actions";

export function SearchResults({ hasConfiguredBoards = false }: { hasConfiguredBoards?: boolean }) {
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [webLocation, setWebLocation] = useState("");
  const [webError, setWebError] = useState("");
  const [webPending, runWeb] = useTransition();

  const [results, setResults] = useState<BoardResult[]>([]);
  const [source, setSource] = useState("");
  const [location, setLocation] = useState("");
  const [boardError, setBoardError] = useState("");
  const [boardPending, runBoards] = useTransition();

  const listings = mergeListings(results).filter(
    (job) =>
      (!source || job.sources.some(({ id }) => id === source)) &&
      job.location.toLowerCase().includes(location.trim().toLowerCase()),
  );

  function searchWeb() {
    setWebError("");
    runWeb(async () => {
      try {
        const response = await discoverWebJobs(webLocation);
        if (response.error) {
          setWebError(response.error);
          return;
        }
        if (response.discovery) {
          setDiscovery(response.discovery);
        }
      } catch {
        setWebError("Web job search could not run. Try again.");
      }
    });
  }

  function searchBoards(retry?: string) {
    setBoardError("");
    runBoards(async () => {
      try {
        const response = await searchSavedJobs(retry);
        if (response.error) setBoardError(response.error);
        if (response.results) {
          const fresh = response.results;
          if (retry) {
            setResults((previous) => previous.map((entry) => (entry.board.id === retry ? fresh[0] : entry)));
          } else {
            setResults(fresh);
            setSource("");
            setLocation("");
          }
        }
      } catch {
        setBoardError("Job search could not run. Try again.");
      }
    });
  }

  async function startFromDiscovered(job: DiscoveredJob) {
    setWebError("");
    const result = await prepareFromDiscoveredJob(job);
    if (result?.error) setWebError(result.error);
  }

  return (
    <>
      <section className="fields" aria-labelledby="web-job-discovery">
        <h2 id="web-job-discovery">Discover jobs across the web</h2>
        <label>
          Preferred location (optional)
          <input
            type="text"
            placeholder="e.g. Bengaluru, Remote, Hybrid"
            value={webLocation}
            onChange={(event) => setWebLocation(event.target.value)}
            maxLength={100}
          />
        </label>
        <button type="button" className="button" disabled={webPending} onClick={searchWeb}>
          {webPending ? "Searching the web…" : "Find matching jobs"}
        </button>
        {webError && <p role="alert">{webError}</p>}
        {discovery && (
          <>
            <p role="status">
              {discovery.jobs.length} {discovery.jobs.length === 1 ? "job" : "jobs"} found ·{" "}
              {discovery.cached ? "Loaded from cache" : "Fresh search"} · Checked{" "}
              {new Date(discovery.checkedAt).toLocaleString()} ({discovery.remainingToday} searches left today)
            </p>
            {discovery.jobs.length === 0 ? (
              <p>No matching postings were found. Try broader job titles or a different location.</p>
            ) : (
              <ul>
                {discovery.jobs.map((job) => (
                  <li key={job.url}>
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      {job.title}
                    </a>
                    <p>
                      {job.company} · {job.location} · Source: {job.source}
                    </p>
                    <p>{job.snippet}</p>
                    <form action={() => startFromDiscovered(job)}>
                      <button type="submit" className="text-button" aria-label={`Prepare for ${job.title}`}>
                        Prepare for this job
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {hasConfiguredBoards && (
        <section className="fields" aria-labelledby="search-listings">
          <h2 id="search-listings">Configured company boards</h2>
          <button type="button" className="button" disabled={boardPending} onClick={() => searchBoards()}>
            {boardPending ? "Searching…" : "Search company boards"}
          </button>
          {boardError && <p role="alert">{boardError}</p>}
          {results.length > 0 && (
            <>
              <ul aria-label="Board status">
                {results.map((entry) => (
                  <li key={entry.board.id}>
                    <strong>{entry.board.name}</strong>{" "}
                    {"error" in entry ? (
                      <>
                        {entry.error}{" "}
                        <button
                          type="button"
                          className="text-button"
                          disabled={boardPending}
                          onClick={() => searchBoards(entry.board.id)}
                        >
                          Retry {entry.board.name}
                        </button>
                      </>
                    ) : (
                      <>
                        · {entry.jobs.length} matches · Checked {new Date(entry.checkedAt).toLocaleString()}
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <label>
                Source{" "}
                <select value={source} onChange={(event) => setSource(event.target.value)}>
                  <option value="">All boards</option>
                  {results.map(({ board }) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Filter by location{" "}
                <input value={location} onChange={(event) => setLocation(event.target.value)} />
              </label>
              <p role="status">{listings.length} listings</p>
              <ul>
                {listings.map((job) => (
                  <li key={job.url}>
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      {job.title}
                    </a>
                    <p>
                      {job.company} · {job.location}
                    </p>
                    <p>Sources: {job.sources.map(({ name }) => name).join(", ")}</p>
                    <form
                      action={async () => {
                        const result = await prepareForListing(job.sources[0].id, job.listingId);
                        if (result?.error) setBoardError(result.error);
                      }}
                    >
                      <button type="submit" className="text-button" aria-label={`Prepare for ${job.title}`}>
                        Prepare for this job
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </>
  );
}