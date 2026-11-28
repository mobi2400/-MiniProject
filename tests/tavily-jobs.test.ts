import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import { run } from "../lib/db";
import { discoverJobsWithTavily, getRemainingDiscoveryQuota } from "../lib/tavily-jobs";
import { resetDatabase } from "./helpers/db";

const ACCOUNT_ID = "test-account-tavily";
const OTHER_ACCOUNT_ID = "test-account-tavily-2";

async function seedAccount(accountId: string) {
  await run("INSERT INTO accounts (id, email, password_hash) VALUES ($1, $2, $3)", [
    accountId,
    `${accountId}@example.com`,
    "hash",
  ]);
  await run("INSERT INTO profiles (account_id, name, career_goal) VALUES ($1, $2, $3)", [
    accountId,
    "Test User",
    "Goal",
  ]);
}

describe("Tavily Job Discovery Tests", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedAccount(ACCOUNT_ID);
    await seedAccount(OTHER_ACCOUNT_ID);
    process.env.TAVILY_API_KEY = "tvly-test-key";
  });

  test("1. Parses titles, companies, HTTPS URLs, deduplicates, and decrements quota", async () => {
    let fetchCalls = 0;
    const mockFetch: typeof fetch = async () => {
      fetchCalls += 1;
      return new Response(
        JSON.stringify({
          results: [
            {
              title: "Frontend Engineer at Acme Corp | Greenhouse",
              url: "https://boards.greenhouse.io/acme/jobs/12345#apply",
              content: "Build React and TypeScript interfaces for our core product.",
            },
            {
              // Duplicate URL after hash stripping — should be deduplicated
              title: "Frontend Engineer at Acme Corp",
              url: "https://boards.greenhouse.io/acme/jobs/12345",
              content: "Duplicate listing entry.",
            },
            {
              title: "Job Application for Full Stack Developer at Beta Labs - Lever",
              url: "https://jobs.lever.co/betalabs/abc-999",
              content: "Work across Node.js, PostgreSQL, and Next.js.",
            },
            {
              // Insecure HTTP URL — should be filtered out
              title: "Insecure Listing at HTTP Corp",
              url: "http://indeed.com/viewjob?jk=insecure",
              content: "Should not appear in results.",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const initialQuota = await getRemainingDiscoveryQuota(ACCOUNT_ID);
    assert.equal(initialQuota, 20);

    const response = await discoverJobsWithTavily(
      ACCOUNT_ID,
      ["Frontend Engineer", "Full Stack Developer"],
      "Bengaluru",
      mockFetch,
    );

    assert.equal(fetchCalls, 1);
    assert.equal(response.cached, false);
    assert.equal(response.remainingToday, 19);
    assert.equal(response.jobs.length, 2);

    assert.equal(response.jobs[0].title, "Frontend Engineer");
    assert.equal(response.jobs[0].company, "Acme Corp");
    assert.equal(response.jobs[0].location, "Bengaluru");
    assert.equal(response.jobs[0].url, "https://boards.greenhouse.io/acme/jobs/12345");
    assert.equal(response.jobs[0].source, "boards.greenhouse.io");

    assert.equal(response.jobs[1].title, "Job Application for Full Stack Developer");
    assert.equal(response.jobs[1].company, "Beta Labs");
    assert.equal(response.jobs[1].source, "jobs.lever.co");

    assert.equal(await getRemainingDiscoveryQuota(ACCOUNT_ID), 19);
  });

  test("2. Returns cached results for normalized title/location queries without calling Tavily or consuming quota", async () => {
    let fetchCalls = 0;
    const mockFetch: typeof fetch = async () => {
      fetchCalls += 1;
      return new Response(
        JSON.stringify({
          results: [
            {
              title: "Software Engineer - Gamma Systems",
              url: "https://jobs.ashbyhq.com/gamma/role-1",
              content: "Distributed backend and API engineering.",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const first = await discoverJobsWithTavily(
      ACCOUNT_ID,
      ["Software Engineer", "Backend Engineer"],
      "Remote",
      mockFetch,
    );
    assert.equal(first.cached, false);
    assert.equal(fetchCalls, 1);

    // Different casing, order, whitespace, and duplicate title — should hit the same cache entry
    const second = await discoverJobsWithTavily(
      OTHER_ACCOUNT_ID,
      ["  backend engineer ", "software engineer", "Software Engineer"],
      " remote ",
      mockFetch,
    );
    assert.equal(second.cached, true);
    assert.equal(fetchCalls, 1);
    assert.equal(second.jobs.length, 1);
    assert.equal(second.jobs[0].company, "Gamma Systems");
    // Cache hits do not consume the second account's daily quota
    assert.equal(await getRemainingDiscoveryQuota(OTHER_ACCOUNT_ID), 20);
  });

  test("3. Enforces daily per-account search quota and handles missing API key", async () => {
    const today = new Date().toISOString().slice(0, 10);
    await run("INSERT INTO job_discovery_usage (account_id, day, searches) VALUES ($1, $2, 20)", [
      ACCOUNT_ID,
      today,
    ]);

    assert.equal(await getRemainingDiscoveryQuota(ACCOUNT_ID), 0);

    await assert.rejects(
      () => discoverJobsWithTavily(ACCOUNT_ID, ["Software Developer"], "Bengaluru"),
      /Daily web job search limit reached/u,
    );

    delete process.env.TAVILY_API_KEY;
    await assert.rejects(
      () => discoverJobsWithTavily(OTHER_ACCOUNT_ID, ["Software Developer"], "Bengaluru"),
      /TAVILY_API_KEY/u,
    );
  });
});