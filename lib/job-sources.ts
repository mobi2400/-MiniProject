export type Board = { id: string; name: string };
export type Listing = { listingId: string; url: string; title: string; location: string; company: string };
export type BoardResult =
  | { board: Board; jobs: Listing[]; checkedAt: number }
  | { board: Board; error: string };

export function configuredBoards(value = process.env.GREENHOUSE_BOARDS ?? "") {
  const boards = new Map<string, Board>();
  for (const entry of value.split(",")) {
    const [token, ...label] = entry.split(":");
    const id = token.trim().toLowerCase();
    if (/^[a-z0-9_\-]{1,80}$/u.test(id)) boards.set(id, { id, name: label.join(":").trim().slice(0, 100) || id });
  }
  return [...boards.values()].slice(0, 12);
}

export async function searchBoard(board: Board, titles: string[], request = fetch): Promise<BoardResult> {
  try {
    const response = await request(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.id)}/jobs`, {
      redirect: "error",
      signal: AbortSignal.timeout(7000),
      next: { revalidate: 120 },
    } as RequestInit);
    if (!response.ok) throw new Error("Board unavailable");
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("jobs" in payload) || !Array.isArray(payload.jobs)) {
      throw new Error("Invalid board response");
    }
    const jobs: Listing[] = [];
    for (const job of payload.jobs) {
      if (!Number.isSafeInteger(job?.id) || job.id < 1 || typeof job.title !== "string" || typeof job.absolute_url !== "string") continue;
      if (!titles.some((title) => job.title.toLowerCase().includes(title.toLowerCase()))) continue;
      const url = URL.parse(job.absolute_url);
      if (!url || url.protocol !== "https:" || url.username || url.password) continue;
      url.hash = "";
      jobs.push({ listingId: String(job.id), url: url.href, title: job.title.slice(0, 240), company: board.name,
        location: typeof job.location?.name === "string" ? job.location.name.slice(0, 240) : "Not specified" });
      if (jobs.length >= 100) break;
    }
    return { board, jobs, checkedAt: Date.now() };
  } catch {
    return { board, error: "Board unavailable. Try again shortly." };
  }
}

export function mergeListings(results: BoardResult[]) {
  const listings = new Map<string, Listing & { sources: Board[] }>();
  for (const result of results) {
    if (!("jobs" in result)) continue;
    for (const job of result.jobs) {
      const current = listings.get(job.url);
      if (!current) listings.set(job.url, { ...job, sources: [result.board] });
      else if (!current.sources.some(({ id }) => id === result.board.id)) current.sources.push(result.board);
    }
  }
  return [...listings.values()];
}
