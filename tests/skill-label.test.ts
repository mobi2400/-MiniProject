import { test } from "node:test";
import assert from "node:assert/strict";
import { skillLabel } from "../lib/skill-label";

test("uses a known skill from the requirement sentence", () => {
  assert.equal(skillLabel("Build reports using SQL joins"), "SQL joins");
  assert.equal(skillLabel("Strong Power BI dashboards experience."), "Power BI");
});

test("does not match a skill inside a longer word", () => {
  assert.equal(skillLabel("Experience with GitHub workflows"), "GitHub workflows");
});

test("removes filler words when no skill matches", () => {
  assert.equal(skillLabel("Experience with Terraform modules."), "Terraform modules");
});

test("keeps long requirements short", () => {
  const label = skillLabel("A very long requirement sentence that goes on and on about many unrelated things in detail");
  assert.ok(label.length <= 61);
  assert.ok(label.endsWith("…"));
});
