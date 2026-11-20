import { convert } from "html-to-text";
import type { Board } from "./job-sources";

export async function readListing(board: Board, listingId: string, request = fetch) {
  if (!/^[1-9]\d{0,15}$/u.test(listingId)) return null;
  const response = await request(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.id)}/jobs/${listingId}`, {
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(7000),
  });
  if (response.status === 404 || response.status === 410) return null;
  if (!response.ok) throw new Error("Job board unavailable");
  const job = await response.json();
  if (String(job?.id) !== listingId || typeof job.title !== "string" ||
    typeof job.content !== "string" || typeof job.absolute_url !== "string") return null;
  const url = URL.parse(job.absolute_url);
  if (!url || url.protocol !== "https:" || url.username || url.password) return null;
  const options = { wordwrap: false as const, selectors: [{ selector: "a", options: { ignoreHref: true } }] };
  const html = job.content.slice(0, 200000);
  const decoded = convert(html, options);
  const description = (/^\s*&lt;/iu.test(html) ? convert(decoded, options) : decoded).trim().slice(0, 20000);
  const title = job.title.trim().slice(0, 160);
  if (!description || !title) return null;
  return {
    title, description, listingId, sourceId: board.id, url: url.href, company: board.name,
    location: typeof job.location?.name === "string" ? job.location.name.slice(0, 240) : "Not specified",
  };
}
