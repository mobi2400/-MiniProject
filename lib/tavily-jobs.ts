import { createHash } from "node:crypto";
import { one, run } from "./db";

export type DiscoveredJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  snippet: string;
};

export type DiscoveryResponse = {
  jobs: DiscoveredJob[];
  cached: boolean;
  checkedAt: number;
  remainingToday: number;
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const DAILY_SEARCH_LIMIT = 20;

const JOB_DOMAINS = [
  "boards.greenhouse.io",
  "job-boards.greenhouse.io",
  "jobs.lever.co",
  "jobs.ashbyhq.com",
  "myworkdayjobs.com",
  "linkedin.com/jobs",
  "indeed.com",
  "wellfound.com",
  "naukri.com",
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeCacheKey(titles: string[], location: string) {
  const normalized = {
    titles: [...new Set(titles.map((t) => t.trim().toLowerCase()).filter(Boolean))].sort(),
    location: location.trim().toLowerCase(),
  };
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

function cleanTitleAndCompany(rawTitle: string, hostname: string): { title: string; company: string } {
  const cleaned = rawTitle.replace(/\s+/gu, " ").trim();
  // Common patterns: "Role - Company | Board" or "Role at Company"
  const atMatch = cleaned.match(/^(.+?)\s+at\s+([^|\-–—]+)(?:[|\-–—].*)?$/iu);
  if (atMatch) {
    return {
      title: atMatch[1].trim().slice(0, 160),
      company: atMatch[2].trim().slice(0, 120),
    };
  }
  const parts = cleaned.split(/\s*(?:\|| - | – | — )\s*/u).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0];
    const second = parts[1];
    // Handle Greenhouse-style "Job Application for Role at Company"
    const appMatch = first.match(/^Job Application for\s+(.+?)\s+at\s+(.+)$/iu);
    if (appMatch) {
      return { title: appMatch[1].trim().slice(0, 160), company: appMatch[2].trim().slice(0, 120) };
    }
    return {
      title: first.slice(0, 160),
      company: second.slice(0, 120),
    };
  }
  const fallbackCompany = hostname.replace(/^www\./u, "").split(".")[0] || "Web listing";
  return {
    title: cleaned.slice(0, 160),
    company: fallbackCompany.charAt(0).toUpperCase() + fallbackCompany.slice(1),
  };
}

function parseTavilyResults(rawResults: unknown[], fallbackLocation: string): DiscoveredJob[] {
  const seen = new Set<string>();
  const jobs: DiscoveredJob[] = [];

  for (const item of rawResults) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.url !== "string" || typeof record.title !== "string") continue;

    const parsedUrl = URL.parse(record.url);
    if (!parsedUrl || parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password) continue;
    parsedUrl.hash = "";
    const href = parsedUrl.href;
    if (seen.has(href)) continue;
    seen.add(href);

    const { title, company } = cleanTitleAndCompany(record.title, parsedUrl.hostname);
    const snippet = typeof record.content === "string"
      ? record.content.replace(/\s+/gu, " ").trim().slice(0, 2000)
      : "";
    if (!title || !snippet) continue;

    jobs.push({
      id: createHash("sha256").update(href).digest("hex").slice(0, 24),
      title,
      company,
      location: fallbackLocation.trim() || "See job posting",
      url: href,
      source: parsedUrl.hostname.replace(/^www\./u, ""),
      snippet,
    });

    if (jobs.length >= 15) break;
  }

  return jobs;
}

export async function getRemainingDiscoveryQuota(accountId: string): Promise<number> {
  const row = await one<{ searches: number }>(
    "SELECT searches FROM job_discovery_usage WHERE account_id = $1 AND day = $2",
    [accountId, todayKey()],
  );
  return Math.max(0, DAILY_SEARCH_LIMIT - (row?.searches ?? 0));
}

export async function discoverJobsWithTavily(
  accountId: string,
  titles: string[],
  location = "",
  request: typeof fetch = fetch,
): Promise<DiscoveryResponse> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Web job search is not configured yet (missing TAVILY_API_KEY).");
  }

  const cacheKey = normalizeCacheKey(titles, location);
  const now = Date.now();

  const cachedRow = await one<{ results_json: string; fetched_at: string | number }>(
    "SELECT results_json, fetched_at FROM job_discovery_cache WHERE cache_key = $1",
    [cacheKey],
  );
  const fetchedAt = cachedRow ? Number(cachedRow.fetched_at) : 0;
  if (cachedRow && now - fetchedAt < CACHE_TTL_MS) {
    const remainingToday = await getRemainingDiscoveryQuota(accountId);
    return {
      jobs: JSON.parse(cachedRow.results_json) as DiscoveredJob[],
      cached: true,
      checkedAt: fetchedAt,
      remainingToday,
    };
  }

  const remaining = await getRemainingDiscoveryQuota(accountId);
  if (remaining <= 0) {
    throw new Error("Daily web job search limit reached. Try again tomorrow or use saved board searches.");
  }

  const titleClause = titles
    .slice(0, 5)
    .map((t) => `"${t.replace(/"/gu, "")}"`)
    .join(" OR ");
  const locationClause = location.trim() ? ` ${location.trim()}` : "";
  const query = `(${titleClause})${locationClause} job opening apply`;

  const response = await request("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 12,
      include_domains: JOB_DOMAINS,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error("Web job search is temporarily unavailable. Try again shortly.");
  }

  const payload: unknown = await response.json();
  const rawResults =
    payload && typeof payload === "object" && "results" in payload && Array.isArray(payload.results)
      ? payload.results
      : [];

  const jobs = parseTavilyResults(rawResults, location);

  await run(
    `
    INSERT INTO job_discovery_cache (cache_key, results_json, fetched_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (cache_key) DO UPDATE SET results_json = excluded.results_json, fetched_at = excluded.fetched_at
    `,
    [cacheKey, JSON.stringify(jobs), now],
  );

  const day = todayKey();
  await run(
    `
    INSERT INTO job_discovery_usage (account_id, day, searches)
    VALUES ($1, $2, 1)
    ON CONFLICT (account_id, day) DO UPDATE SET searches = job_discovery_usage.searches + 1
    `,
    [accountId, day],
  );

  return {
    jobs,
    cached: false,
    checkedAt: now,
    remainingToday: Math.max(0, remaining - 1),
  };
}