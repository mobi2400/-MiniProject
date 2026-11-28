import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestRequirements } from "../lib/requirement-suggestions";

test("picks requirement sentences and skips company and location lines", () => {
  const description = [
    "Company: Acme",
    "Location: Bengaluru",
    "- Proficiency in SQL, Python, and advanced Excel.",
    "- Hands-on experience with BI tools.",
    "We are a friendly team with great snacks.",
  ].join("\n");
  const result = suggestRequirements(description);
  assert.ok(result.includes("Proficiency in SQL, Python, and advanced Excel"));
  assert.ok(result.includes("Hands-on experience with BI tools"));
  assert.ok(!result.some((text) => text.includes("snacks")));
});

test("every suggestion is an exact part of the description", () => {
  const description = "Ability to design dashboards that tell a compelling story. Years of experience in reporting [...] Degree preferred.";
  const normalize = (text: string) => text.replace(/\s+/gu, " ").toLowerCase();
  for (const text of suggestRequirements(description)) {
    assert.ok(normalize(description).includes(normalize(text)), text);
  }
});

test("removes duplicates and respects the limit", () => {
  const description = Array.from({ length: 30 }, (_, i) => `Experience with skill number ${i} in reporting.`).join("\n");
  assert.equal(suggestRequirements(description, 5).length, 5);
  assert.equal(suggestRequirements("Experience with SQL.\nexperience with sql.").length, 1);
});
