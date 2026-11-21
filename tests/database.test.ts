import { test, describe, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { resetDatabase } from "./helpers/db";
import { db, one, many, run, tx } from "../lib/db";
import { createPreparation, readTargetJob, readListingSnapshot, deletePreparation } from "../lib/preparations";
import { saveCv, readCv, saveCvCorrection } from "../lib/cv";
import { readCvSource, readCvRevision } from "../lib/cv-revision";
import { saveKeywordConfirmation, readKeywordConfirmations } from "../lib/keyword-confirmations";
import { saveTailoredDraft, readTailoredDraft } from "../lib/tailored-cv";
import { hasReadiness, readReassessments } from "../lib/training";
import { requireAccount, startSession } from "../lib/session";

describe("Database Integration Tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  after(async () => {
    try {
      await db().end();
    } catch {}
  });

  async function createTestAccount(id: string, email: string) {
    await run("INSERT INTO accounts (id, email, password_hash) VALUES ($1, $2, $3)", [id, email, "hash"]);
    await run("INSERT INTO profiles (account_id, name, career_goal) VALUES ($1, $2, $3)", [id, "Test User", "Goal"]);
  }

  test("1. Ownership: preparation owned by account A cannot be read by account B", async () => {
    await createTestAccount("accA", "a@example.com");
    await createTestAccount("accB", "b@example.com");

    await createPreparation("accA", "prep1", "Software Engineer", "Description A");
    await saveCv("accA", "prep1", "cv.txt", new TextEncoder().encode("Skills\nSQL"), [
      { section: "Skills", excerpt: "SQL", line: 2 },
    ]);

    // Account A can read
    const jobA = await readTargetJob("accA", "prep1");
    assert.ok(jobA);
    assert.equal(jobA.title, "Software Engineer");

    const cvA = await readCv("accA", "prep1");
    assert.ok(cvA);

    const cvSourceA = await readCvSource("accA", "prep1", 1);
    assert.ok(cvSourceA);

    // Account B cannot read
    const jobB = await readTargetJob("accB", "prep1");
    assert.equal(jobB, undefined);

    const cvB = await readCv("accB", "prep1");
    assert.equal(cvB, undefined);

    const cvSourceB = await readCvSource("accB", "prep1", 1);
    assert.equal(cvSourceB, undefined);

    const listingB = await readListingSnapshot("accB", "prep1");
    assert.equal(listingB, undefined);
  });

  test("2. CV versions: saveCv increments version, saveCvCorrection guard works, source unchanged", async () => {
    await createTestAccount("acc1", "user@example.com");
    await createPreparation("acc1", "prep1", "Engineer", "Desc");

    const originalBytes = new TextEncoder().encode("Skills\nSQL");
    await saveCv("acc1", "prep1", "cv.txt", originalBytes, [{ section: "Skills", excerpt: "SQL", line: 2 }]);

    const cv1 = await readCv("acc1", "prep1");
    assert.equal(cv1?.version, 1);

    // Correction with stale version (version 99) fails
    const staleResult = await saveCvCorrection("acc1", "prep1", 99, [{ section: "Experience", excerpt: "SQL", line: 2 }]);
    assert.equal(staleResult, false);

    // Correction with current version 1 succeeds and creates version 2
    const okResult = await saveCvCorrection("acc1", "prep1", 1, [{ section: "Experience", excerpt: "SQL", line: 2 }]);
    assert.equal(okResult, true);

    const cv2 = await readCv("acc1", "prep1");
    assert.equal(cv2?.version, 2);
    assert.equal(cv2?.evidence[0].section, "Experience");

    // Check that original source of v1 is unchanged
    const source1 = await readCvSource("acc1", "prep1", 1);
    assert.deepEqual(source1?.source, Buffer.from(originalBytes));

    const source2 = await readCvSource("acc1", "prep1", 2);
    assert.deepEqual(source2?.source, Buffer.from(originalBytes));
  });

  test("3. Comparison guard: saveComparison SQL inserts only when cv and job are latest", async () => {
    await createTestAccount("acc1", "user@example.com");
    await createPreparation("acc1", "prep1", "Engineer", "Desc");
    await saveCv("acc1", "prep1", "cv.txt", new Uint8Array([1, 2, 3]), [{ section: "Skills", excerpt: "SQL", line: 1 }]);

    // Insert comparison with outdated cv_version (e.g. 0)
    const count = await run(
      `
      INSERT INTO cv_comparisons (preparation_id, cv_version, job_version, items_json, score)
      SELECT p.id, $1, $2, $3, $4 FROM preparations p
      WHERE p.id = $5 AND p.account_id = $6
        AND $7 = (SELECT MAX(version) FROM cv_versions WHERE preparation_id = p.id)
        AND $8 = (SELECT MAX(version) FROM target_job_versions WHERE preparation_id = p.id)
      ON CONFLICT (preparation_id, cv_version, job_version)
      DO UPDATE SET items_json = excluded.items_json, score = excluded.score
      `,
      [0, 1, "[]", 80, "prep1", "acc1", 0, 1],
    );
    assert.equal(count, 0);
  });

  test("4. Keyword confirmations: CHECK constraint, changing to missing, stale version guards", async () => {
    await createTestAccount("acc1", "user@example.com");
    await createPreparation("acc1", "prep1", "Engineer", "Desc", {
      sourceId: "board1",
      listingId: "123",
      url: "http://example.com",
      company: "Acme",
      location: "Remote",
    });
    await saveCv("acc1", "prep1", "cv.txt", new Uint8Array([1]), [{ section: "Skills", excerpt: "SQL", line: 1 }]);

    // 'have' with empty detail rejected by CHECK constraint
    await assert.rejects(async () => {
      await saveKeywordConfirmation("acc1", "prep1", 1, 1, {
        term: "TypeScript",
        status: "have",
        detail: "   ",
      });
    });

    // Valid save
    const ok = await saveKeywordConfirmation("acc1", "prep1", 1, 1, {
      term: "TypeScript",
      status: "have",
      detail: "Used 3 years",
    });
    assert.equal(ok, true);

    let confirmations = await readKeywordConfirmations("acc1", "prep1", 1);
    assert.equal(confirmations.find((c) => c.term === "TypeScript")?.detail, "Used 3 years");

    // Changing term to 'missing' clears detail
    await saveKeywordConfirmation("acc1", "prep1", 1, 1, {
      term: "TypeScript",
      status: "missing",
      detail: "",
    });
    confirmations = await readKeywordConfirmations("acc1", "prep1", 1);
    assert.equal(confirmations.find((c) => c.term === "TypeScript")?.detail, "");

    // Stale job version returns false
    const staleJob = await saveKeywordConfirmation("acc1", "prep1", 99, 1, {
      term: "TypeScript",
      status: "learning",
      detail: "",
    });
    assert.equal(staleJob, false);
  });

  test("5. Tailored draft: stale job version returns false, updates row without duplicating", async () => {
    await createTestAccount("acc1", "user@example.com");
    await createPreparation("acc1", "prep1", "Engineer", "Desc", {
      sourceId: "board1",
      listingId: "123",
      url: "http://example.com",
      company: "Acme",
      location: "Remote",
    });
    await saveCv("acc1", "prep1", "cv.txt", new Uint8Array([1]), [{ section: "Skills", excerpt: "SQL", line: 1 }]);

    // Stale job version
    const stale = await saveTailoredDraft("acc1", "prep1", 99, 1, []);
    assert.equal(stale, false);

    // Initial save
    const ok1 = await saveTailoredDraft("acc1", "prep1", 1, 1, [
      { terms: ["SQL"], section: "Skills", text: "SQL text", source: { type: "cv", line: 1 } },
    ]);
    assert.equal(ok1, true);

    const draft1 = await readTailoredDraft("acc1", "prep1");
    assert.equal(draft1?.edits.length, 1);

    // Second save updates row
    const ok2 = await saveTailoredDraft("acc1", "prep1", 1, 1, [
      { terms: ["SQL", "Postgres"], section: "Skills", text: "Updated text", source: { type: "cv", line: 1 } },
    ]);
    assert.equal(ok2, true);

    const draft2 = await readTailoredDraft("acc1", "prep1");
    assert.equal(draft2?.edits[0].terms.length, 2);

    const count = await one<{ count: number }>("SELECT count(*)::int as count FROM tailored_cv_drafts WHERE preparation_id = $1", ["prep1"]);
    assert.equal(count?.count, 1);
  });

  test("6. Diagnostic: submitDiagnostic UPDATE only applies when submitted_at IS NULL", async () => {
    await createTestAccount("acc1", "user@example.com");
    await createPreparation("acc1", "prep1", "Engineer", "Desc");

    await run(
      "INSERT INTO diagnostic_attempts (preparation_id, job_version, question_json) VALUES ($1, $2, $3)",
      ["prep1", 1, JSON.stringify({ prompt: "Q?", options: ["A", "B"], answer: 0, feedback: "fb" })],
    );

    // First submit updates
    const now = Date.now();
    const count1 = await run(
      `
      UPDATE diagnostic_attempts SET submitted_at = $1, selected_answer = $2, score = $3
      WHERE preparation_id = $4 AND job_version = $5 AND submitted_at IS NULL
        AND EXISTS (SELECT 1 FROM preparations WHERE id = $6 AND account_id = $7)
      `,
      [now, 0, 100, "prep1", 1, "prep1", "acc1"],
    );
    assert.equal(count1, 1);

    // Second submit changes nothing
    const count2 = await run(
      `
      UPDATE diagnostic_attempts SET submitted_at = $1, selected_answer = $2, score = $3
      WHERE preparation_id = $4 AND job_version = $5 AND submitted_at IS NULL
        AND EXISTS (SELECT 1 FROM preparations WHERE id = $6 AND account_id = $7)
      `,
      [Date.now(), 1, 0, "prep1", 1, "prep1", "acc1"],
    );
    assert.equal(count2, 0);
  });

  test("7. Reassessment: partial unique index one_open_reassessment and unique question_id", async () => {
    await createTestAccount("acc1", "user@example.com");
    await createPreparation("acc1", "prep1", "Engineer", "Desc");

    // Insert first open attempt (score IS NULL)
    await run(
      `INSERT INTO reassessments (preparation_id, job_version, sequence, question_id, question_json, score)
       VALUES ($1, $2, $3, $4, $5, NULL)`,
      ["prep1", 1, 1, "q1", JSON.stringify({ prompt: "Q1" })],
    );

    // Second open attempt must fail due to one_open_reassessment
    await assert.rejects(async () => {
      await run(
        `INSERT INTO reassessments (preparation_id, job_version, sequence, question_id, question_json, score)
         VALUES ($1, $2, $3, $4, $5, NULL)`,
        ["prep1", 1, 2, "q2", JSON.stringify({ prompt: "Q2" })],
      );
    });

    // Close first attempt
    await run("UPDATE reassessments SET score = 100 WHERE preparation_id = $1 AND sequence = 1", ["prep1"]);

    // Repeating question_id in same job version fails
    await assert.rejects(async () => {
      await run(
        `INSERT INTO reassessments (preparation_id, job_version, sequence, question_id, question_json, score)
         VALUES ($1, $2, $3, $4, $5, 100)`,
        ["prep1", 1, 2, "q1", JSON.stringify({ prompt: "Q1" })],
      );
    });
  });

  test("8. Readiness: hasReadiness returns true only for two consecutive scores >= 75", () => {
    assert.equal(hasReadiness([]), false);
    assert.equal(hasReadiness([{ score: 100 }]), false);
    assert.equal(hasReadiness([{ score: 50 }, { score: 100 }]), false);
    assert.equal(hasReadiness([{ score: 100 }, { score: 50 }]), false);
    assert.equal(hasReadiness([{ score: 75 }, { score: 75 }]), true);
    assert.equal(hasReadiness([{ score: 0 }, { score: 80 }, { score: 90 }]), true);
    assert.equal(hasReadiness([{ score: 90 }, { score: 90 }, { score: 50 }]), false);
  });

  test("9. Deletion cascade: deletePreparation removes all connected tables and leaves other preps intact", async () => {
    await createTestAccount("acc1", "user@example.com");
    await createPreparation("acc1", "prep1", "Engineer 1", "Desc 1", {
      sourceId: "board1",
      listingId: "123",
      url: "http://example.com/1",
      company: "Acme",
      location: "Remote",
    });
    await createPreparation("acc1", "prep2", "Engineer 2", "Desc 2");

    await saveCv("acc1", "prep1", "cv.txt", new Uint8Array([1]), [{ section: "Skills", excerpt: "SQL", line: 1 }]);
    await run(
      "INSERT INTO diagnostic_attempts (preparation_id, job_version, question_json) VALUES ($1, $2, $3)",
      ["prep1", 1, "{}"],
    );
    await run(
      "INSERT INTO reassessments (preparation_id, job_version, sequence, question_id, question_json, score) VALUES ($1, $2, $3, $4, $5, 100)",
      ["prep1", 1, 1, "q1", "{}"],
    );

    // Delete prep1
    await deletePreparation("acc1", "prep1");

    assert.equal(await readTargetJob("acc1", "prep1"), undefined);
    assert.equal(await readCv("acc1", "prep1"), undefined);
    assert.equal((await readReassessments("acc1", "prep1", 1)).length, 0);

    // prep2 remains intact
    const job2 = await readTargetJob("acc1", "prep2");
    assert.ok(job2);
    assert.equal(job2.title, "Engineer 2");
  });

  test("10. Timestamps: Date.now() stored in BIGINT reads back as number", async () => {
    await createTestAccount("acc1", "user@example.com");
    const now = Date.now();
    await run("INSERT INTO preparations (id, account_id, created_at) VALUES ($1, $2, $3)", ["prep1", "acc1", now]);

    const row = await one<{ created_at: unknown }>("SELECT created_at FROM preparations WHERE id = $1", ["prep1"]);
    assert.equal(typeof row?.created_at, "number");
    assert.equal(row?.created_at, now);
  });

  test("11. Concurrency: parallel createPreparation and startReassessment", async () => {
    await createTestAccount("acc1", "user@example.com");

    // Concurrency 1: two parallel createPreparation calls with same ID
    await Promise.all([
      createPreparation("acc1", "prep1", "Role", "Description"),
      createPreparation("acc1", "prep1", "Role", "Description"),
    ]);

    const prepCount = await one<{ count: number }>("SELECT count(*)::int as count FROM preparations WHERE id = $1", ["prep1"]);
    assert.equal(prepCount?.count, 1);

    // Concurrency 2: startReassessment with same expectedCount
    // Set up prerequisite diagnostic
    await run(
      "INSERT INTO diagnostic_attempts (preparation_id, job_version, question_json, submitted_at, score) VALUES ($1, $2, $3, $4, $5)",
      ["prep1", 1, "{}", Date.now(), 100],
    );

    // Emulate parallel tx for startReassessment
    const startReassessmentFn = async () => {
      await tx(async (client) => {
        await client.query("SELECT 1 FROM target_job_versions WHERE preparation_id = $1 AND version = $2 FOR UPDATE", [
          "prep1",
          1,
        ]);
        const attemptsRes = await client.query(
          "SELECT sequence, question_id, score FROM reassessments WHERE preparation_id = $1 AND job_version = $2",
          ["prep1", 1],
        );
        if (attemptsRes.rows.length === 0) {
          await client.query(
            "INSERT INTO reassessments (preparation_id, job_version, sequence, question_id, question_json) VALUES ($1, $2, $3, $4, $5)",
            ["prep1", 1, 1, "q_concurrency", "{}"],
          );
        }
      });
    };

    await Promise.all([startReassessmentFn(), startReassessmentFn()]);

    const reassessments = await many("SELECT * FROM reassessments WHERE preparation_id = $1", ["prep1"]);
    assert.equal(reassessments.length, 1);
  });

  test("12. Session: expired session row is rejected", async () => {
    await createTestAccount("acc1", "user@example.com");
    const past = Math.floor(Date.now() / 1000) - 3600;
    await run("INSERT INTO sessions (id, account_id, expires_at) VALUES ($1, $2, $3)", ["sess1", "acc1", past]);

    const active = await one(
      "SELECT 1 FROM sessions WHERE id = $1 AND account_id = $2 AND expires_at > $3",
      ["sess1", "acc1", Math.floor(Date.now() / 1000)],
    );
    assert.equal(active, undefined);
  });
});
